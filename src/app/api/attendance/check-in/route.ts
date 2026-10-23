import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireTrackAccess } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { error, user } = await requireAuth();
    if (error || !user) return error;

    const body = await req.json();
    const { action, sessionId, code } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required." }, { status: 400 });
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { track: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    // Action: GENERATE (Instructor or Admin)
    if (action === "GENERATE") {
      const { error: trackError, canEdit } = await requireTrackAccess(session.trackId);
      if (trackError) return trackError;
      if (!canEdit) {
        return NextResponse.json({ error: "Unauthorized to generate check-in code." }, { status: 403 });
      }

      // Generate random 6-digit code
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      // Strictly 15-second rotation window (with 3-second transit tolerance)
      const expiresAt = new Date(Date.now() + 18 * 1000);

      await prisma.session.update({
        where: { id: sessionId },
        data: {
          checkInCode: generatedCode,
          codeExpiresAt: expiresAt,
        },
      });

      return NextResponse.json({
        success: true,
        code: generatedCode,
        expiresAt: expiresAt.toISOString(),
        message: "Dynamic 15-second security check-in code generated.",
      });
    }

    // Action: VERIFY (Student)
    if (action === "VERIFY") {
      if (user.role !== "STUDENT") {
        return NextResponse.json({ error: "Only enrolled students can check-in." }, { status: 403 });
      }

      // Check enrollment
      const isEnrolled = user.enrollments.some((e) => e.trackId === session.trackId);
      if (!isEnrolled) {
        return NextResponse.json({ error: "You are not enrolled in this track." }, { status: 403 });
      }

      if (!code || !code.trim()) {
        return NextResponse.json({ error: "Please enter the 6-digit check-in code." }, { status: 400 });
      }

      const activeCode = (session.checkInCode || "").trim();
      if (!activeCode || activeCode !== code.trim()) {
        return NextResponse.json({
          error: "Incorrect or expired check-in code. Please scan the current code displayed on the screen.",
        }, { status: 400 });
      }

      if (session.codeExpiresAt && new Date() > new Date(session.codeExpiresAt)) {
        return NextResponse.json({ error: "This check-in code has expired. Please scan the current code on screen." }, { status: 400 });
      }

      // Record attendance as PRESENT
      await prisma.attendanceRecord.upsert({
        where: {
          sessionId_studentId: {
            sessionId,
            studentId: user.id,
          },
        },
        update: {
          status: "PRESENT",
          markedAt: new Date(),
          notes: "Self check-in via dynamic session code",
        },
        create: {
          sessionId,
          studentId: user.id,
          status: "PRESENT",
          notes: "Self check-in via dynamic session code",
        },
      });

      return NextResponse.json({
        success: true,
        message: `Attendance confirmed! You are marked PRESENT for ${session.title}.`,
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json({ error: "Failed to process check-in." }, { status: 500 });
  }
}
