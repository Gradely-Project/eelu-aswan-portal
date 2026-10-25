import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTrackAccess } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const trackId = searchParams.get("trackId");

    if (!trackId) {
      return NextResponse.json({ error: "Track ID is required." }, { status: 400 });
    }

    const { error, user } = await requireTrackAccess(trackId);
    if (error || !user) return error;

    const tasks = await prisma.task.findMany({
      where: { trackId },
      orderBy: { deadline: "asc" },
      include: {
        _count: {
          select: { submissions: true },
        },
        submissions:
          user.role === "STUDENT"
            ? {
                where: { studentId: user.id },
              }
            : false,
      },
    });

    const now = new Date();
    const tasksWithStatus = tasks.map((t) => {
      const isPastDeadline = new Date(t.deadline) < now;
      const isSubmissionLocked = t.isClosed || isPastDeadline;
      return {
        ...t,
        isPastDeadline,
        isSubmissionLocked,
        mySubmission: user.role === "STUDENT" && t.submissions ? t.submissions[0] || null : undefined,
      };
    });

    return NextResponse.json({ tasks: tasksWithStatus });
  } catch (error) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json({ error: "Failed to load tasks." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { trackId, title, description, maxScore, deadline, materialsLink } = body;

    if (!trackId || !title || !description || !deadline) {
      return NextResponse.json(
        { error: "Please enter track, task title, description, and submission deadline." },
        { status: 400 }
      );
    }

    const { error, canEdit } = await requireTrackAccess(trackId);
    if (error) return error;
    if (!canEdit) {
      return NextResponse.json({ error: "Unauthorized to create tasks in this track." }, { status: 403 });
    }

    const task = await prisma.task.create({
      data: {
        trackId,
        title: title.trim(),
        description: description.trim(),
        maxScore: Number(maxScore) || 100,
        deadline: new Date(deadline),
        materialsLink: materialsLink ? materialsLink.trim() : null,
      },
    });

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json({ error: "Failed to create task." }, { status: 500 });
  }
}
