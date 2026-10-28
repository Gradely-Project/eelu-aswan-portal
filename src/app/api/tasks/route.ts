import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireTrackAccess } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { error: authError, user } = await requireAuth();
    if (authError || !user) return authError;

    const { searchParams } = new URL(req.url);
    const trackId = searchParams.get("trackId");

    let whereClause: any = {};
    if (trackId && trackId !== "ALL") {
      const { error: trackError } = await requireTrackAccess(trackId);
      if (trackError) return trackError;
      whereClause.trackId = trackId;
    } else {
      // "ALL" or empty
      if (user.role === "INSTRUCTOR") {
        if (!user.assignedTrackId) return NextResponse.json({ tasks: [] });
        whereClause.trackId = user.assignedTrackId;
      } else if (user.role === "STUDENT") {
        const studentTrackIds = user.enrollments?.map((e) => e.trackId) || [];
        whereClause.trackId = { in: studentTrackIds };
      }
      // ADMIN, CHAIR_PERSON, VICE_CHAIR see ALL tasks across all tracks!
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      orderBy: { deadline: "asc" },
      include: {
        track: {
          select: { id: true, name: true },
        },
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
      let hasException = false;
      if (t.exceptions) {
        try {
          const ex = JSON.parse(t.exceptions);
          if (Array.isArray(ex) && (ex.includes(user.id) || ex.includes(user.email))) {
            hasException = true;
          }
        } catch {}
      }

      const isPastDeadline = new Date(t.deadline) < now;
      const isSubmissionLocked = !hasException && (t.isClosed || isPastDeadline);

      return {
        ...t,
        isPastDeadline,
        isSubmissionLocked,
        hasException,
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
    const { error: authError, user } = await requireAuth();
    if (authError || !user) return authError;

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

    const creatorRoleLabel = user.trackTeamRole
      ? user.trackTeamRole === "HEAD"
        ? "Track Head"
        : user.trackTeamRole === "VICE_HEAD"
        ? "Vice Head"
        : "Core Team"
      : user.role === "ADMIN"
      ? "Main Administrator"
      : user.role === "CHAIR_PERSON"
      ? "Chairperson"
      : "Instructor";

    const task = await prisma.task.create({
      data: {
        trackId,
        title: title.trim(),
        description: description.trim(),
        maxScore: Number(maxScore) || 100,
        deadline: new Date(deadline),
        materialsLink: materialsLink ? materialsLink.trim() : null,
        createdById: user.id,
        createdByName: user.name,
        createdByRole: creatorRoleLabel,
      },
    });

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json({ error: "Failed to create task." }, { status: 500 });
  }
}
