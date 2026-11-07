import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { error, user } = await requireAuth();
    if (error || !user) return error;

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required." }, { status: 400 });
    }

    if (user.role === "STUDENT") {
      const instructorName = searchParams.get("instructorName");
      const whereClause: any = {
        sessionId,
        studentId: user.id,
      };
      if (instructorName) {
        whereClause.instructorName = instructorName;
      }
      const evaluations = await prisma.sessionEvaluation.findMany({
        where: whereClause,
      });
      return NextResponse.json({
        evaluations,
        evaluation: evaluations.length > 0 ? evaluations[0] : null,
      });
    }

    // Verify track access for staff
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { trackId: true },
    });
    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    if (user.role === "INSTRUCTOR" && user.assignedTrackId !== session.trackId) {
      return NextResponse.json(
        { error: "Unauthorized. You can only view evaluations for your assigned track." },
        { status: 403 }
      );
    }

    // Staff view: all evaluations for this session + aggregate stats
    const evaluations = await prisma.sessionEvaluation.findMany({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
    });

    const count = evaluations.length;
    const avgClarity = count > 0 ? (evaluations.reduce((a, b) => a + b.clarityRating, 0) / count).toFixed(1) : "0.0";
    const avgMaterial = count > 0 ? (evaluations.reduce((a, b) => a + b.materialRating, 0) / count).toFixed(1) : "0.0";
    const avgOverall = count > 0 ? (evaluations.reduce((a, b) => a + b.overallRating, 0) / count).toFixed(1) : "0.0";

    return NextResponse.json({
      evaluations,
      stats: {
        totalEvaluations: count,
        avgClarity,
        avgMaterial,
        avgOverall,
      },
    });
  } catch (error) {
    console.error("GET /api/sessions/evaluate error:", error);
    return NextResponse.json({ error: "Failed to load session evaluations." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { error, user } = await requireAuth();
    if (error || !user) return error;

    if (user.role !== "STUDENT") {
      return NextResponse.json({ error: "Only students can submit lecture evaluations." }, { status: 403 });
    }

    const body = await req.json();
    const {
      sessionId,
      clarityRating,
      materialRating,
      overallRating,
      feedbackText,
      instructorName,
      instructorRole,
    } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required." }, { status: 400 });
    }

    // Verify session exists and student is enrolled in its track
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { id: true, trackId: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Lecture session not found." }, { status: 404 });
    }

    const isEnrolled = user.enrollments?.some((e) => e.trackId === session.trackId);
    if (!isEnrolled) {
      return NextResponse.json(
        { error: "غير مصرح: لا يمكنك تقييم محاضرة في تراك غير مسجل به." },
        { status: 403 }
      );
    }

    // Strictly sanitize and clamp ratings between 1 and 5
    const clampRating = (val: any) => {
      const num = Number(val);
      if (isNaN(num)) return 5;
      return Math.max(1, Math.min(5, Math.round(num)));
    };

    const safeClarity = clampRating(clarityRating);
    const safeMaterial = clampRating(materialRating);
    const safeOverall = clampRating(overallRating);
    const safeFeedback = feedbackText ? String(feedbackText).trim().substring(0, 1000) : null;
    const safeInstructorName = instructorName ? String(instructorName).trim().substring(0, 100) : null;
    const safeInstructorRole = instructorRole ? String(instructorRole).trim().substring(0, 50) : null;

    // Find existing evaluation for this student + session + instructor
    const existing = await prisma.sessionEvaluation.findFirst({
      where: {
        sessionId,
        studentId: user.id,
        instructorName: safeInstructorName,
      },
    });

    let evaluation;
    if (existing) {
      evaluation = await prisma.sessionEvaluation.update({
        where: { id: existing.id },
        data: {
          instructorRole: safeInstructorRole,
          clarityRating: safeClarity,
          materialRating: safeMaterial,
          overallRating: safeOverall,
          feedbackText: safeFeedback,
          studentName: user.name,
          studentEmail: user.email,
        },
      });
    } else {
      evaluation = await prisma.sessionEvaluation.create({
        data: {
          sessionId,
          studentId: user.id,
          studentName: user.name,
          studentEmail: user.email,
          instructorName: safeInstructorName,
          instructorRole: safeInstructorRole,
          clarityRating: safeClarity,
          materialRating: safeMaterial,
          overallRating: safeOverall,
          feedbackText: safeFeedback,
        },
      });
    }

    return NextResponse.json({
      success: true,
      evaluation,
      message: `Thank you! Your feedback for ${instructorName || "instructor"} has been saved.`,
    });
  } catch (error) {
    console.error("POST /api/sessions/evaluate error:", error);
    return NextResponse.json({ error: "Failed to submit evaluation." }, { status: 500 });
  }
}
