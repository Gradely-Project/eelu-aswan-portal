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
      // Return student's own evaluation if exists
      const evaluation = await prisma.sessionEvaluation.findUnique({
        where: {
          sessionId_studentId: {
            sessionId,
            studentId: user.id,
          },
        },
      });
      return NextResponse.json({ evaluation });
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

    const evaluation = await prisma.sessionEvaluation.upsert({
      where: {
        sessionId_studentId: {
          sessionId,
          studentId: user.id,
        },
      },
      update: {
        instructorName: instructorName || null,
        instructorRole: instructorRole || null,
        clarityRating: Number(clarityRating) || 5,
        materialRating: Number(materialRating) || 5,
        overallRating: Number(overallRating) || 5,
        feedbackText: feedbackText ? feedbackText.trim() : null,
      },
      create: {
        sessionId,
        studentId: user.id,
        studentName: user.name,
        instructorName: instructorName || null,
        instructorRole: instructorRole || null,
        clarityRating: Number(clarityRating) || 5,
        materialRating: Number(materialRating) || 5,
        overallRating: Number(overallRating) || 5,
        feedbackText: feedbackText ? feedbackText.trim() : null,
      },
    });

    return NextResponse.json({
      success: true,
      evaluation,
      message: "Thank you! Your lecture feedback has been recorded.",
    });
  } catch (error) {
    console.error("POST /api/sessions/evaluate error:", error);
    return NextResponse.json({ error: "Failed to submit evaluation." }, { status: 500 });
  }
}
