import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTrackAccess } from "@/lib/permissions";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { trackId, studentId, points, reason } = body;

    if (!trackId || !studentId || points === undefined || !reason) {
      return NextResponse.json(
        { error: "Please specify the track, student, points value, and reason." },
        { status: 400 }
      );
    }

    const { error, user, canEdit } = await requireTrackAccess(trackId);
    if (error || !user) return error;
    if (!canEdit) {
      return NextResponse.json({ error: "Unauthorized to award bonus points in this track." }, { status: 403 });
    }

    // Verify student exists and is enrolled in this track
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: { enrollments: true },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found." }, { status: 404 });
    }

    const isEnrolled = student.enrollments.some((e) => e.trackId === trackId);
    if (!isEnrolled) {
      return NextResponse.json(
        { error: "This student is not enrolled in this track." },
        { status: 400 }
      );
    }

    // Strictly clamp bonus/deduction points between -100 and +100 per action
    const numericPoints = Math.max(-100, Math.min(100, Math.round(Number(points) || 0)));
    const cleanReason = String(reason).trim().substring(0, 250);

    const bonus = await prisma.bonusPoint.create({
      data: {
        trackId,
        studentId,
        points: numericPoints,
        reason: cleanReason,
        awardedBy: user.name,
      },
      include: {
        student: { select: { name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Awarded ${bonus.points} points successfully to (${bonus.student.name}).`,
      bonus,
    });
  } catch (error) {
    console.error("POST /api/bonus error:", error);
    return NextResponse.json({ error: "Failed to award bonus points." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Bonus point ID is required." }, { status: 400 });
    }

    const bonus = await prisma.bonusPoint.findUnique({ where: { id } });
    if (!bonus) {
      return NextResponse.json({ error: "Bonus point not found." }, { status: 404 });
    }

    const { error, canEdit } = await requireTrackAccess(bonus.trackId);
    if (error) return error;
    if (!canEdit) {
      return NextResponse.json({ error: "Unauthorized to delete this bonus point." }, { status: 403 });
    }

    await prisma.bonusPoint.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Bonus points deleted successfully." });
  } catch (error) {
    console.error("DELETE /api/bonus error:", error);
    return NextResponse.json({ error: "Failed to delete bonus point." }, { status: 500 });
  }
}
