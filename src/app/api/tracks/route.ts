import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

export async function GET() {
  try {
    const tracks = await prisma.track.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            enrollments: true,
            sessions: true,
            tasks: true,
            instructors: true,
          },
        },
        instructors: {
          select: {
            id: true,
            name: true,
            email: true,
            trackTeamRole: true,
          },
        },
      },
    });

    return NextResponse.json({ tracks });
  } catch (error) {
    console.error("GET /api/tracks error:", error);
    return NextResponse.json({ error: "Failed to load tracks." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await req.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Track name is required." }, { status: 400 });
    }

    const existing = await prisma.track.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return NextResponse.json({ error: "A track with this name already exists." }, { status: 400 });
    }

    const track = await prisma.track.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
      },
    });

    return NextResponse.json({ success: true, track });
  } catch (error) {
    console.error("POST /api/tracks error:", error);
    return NextResponse.json({ error: "Failed to create track." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Track ID is required." }, { status: 400 });
    }

    const track = await prisma.track.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            enrollments: true,
            sessions: true,
            tasks: true,
          },
        },
      },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found." }, { status: 404 });
    }

    // Unassign instructors first
    await prisma.user.updateMany({
      where: { assignedTrackId: id },
      data: { assignedTrackId: null, trackTeamRole: null },
    });

    // Delete enrollments, sessions (and attendance), tasks (and submissions), bonus points
    await prisma.trackEnrollment.deleteMany({ where: { trackId: id } });
    await prisma.bonusPoint.deleteMany({ where: { trackId: id } });
    await prisma.weeklySchedule.deleteMany({ where: { trackId: id } });

    // Sessions and Tasks have cascades in schema, but delete them safely
    const sessions = await prisma.session.findMany({ where: { trackId: id }, select: { id: true } });
    for (const s of sessions) {
      await prisma.attendanceRecord.deleteMany({ where: { sessionId: s.id } });
    }
    await prisma.session.deleteMany({ where: { trackId: id } });

    const tasks = await prisma.task.findMany({ where: { trackId: id }, select: { id: true } });
    for (const t of tasks) {
      await prisma.taskSubmission.deleteMany({ where: { taskId: t.id } });
    }
    await prisma.task.deleteMany({ where: { trackId: id } });

    await prisma.track.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Track "${track.name}" and associated data deleted successfully.`,
    });
  } catch (error) {
    console.error("DELETE /api/tracks error:", error);
    return NextResponse.json({ error: "Failed to delete track." }, { status: 500 });
  }
}
