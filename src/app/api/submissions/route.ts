import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

export async function POST(req: Request) {
  try {
    const { error, user } = await requireAuth();
    if (error || !user) return error;

    if (user.role !== "STUDENT") {
      return NextResponse.json({ error: "Task submissions are only open for students." }, { status: 403 });
    }

    const body = await req.json();
    const { taskId, solutionLink, notes } = body;

    if (!taskId || !solutionLink) {
      return NextResponse.json(
        { error: "Please provide your solution URL (Google Drive, GitHub, etc.)." },
        { status: 400 }
      );
    }

    // Verify task existence and status
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    // Check student enrollment in task's track
    const enrollment = await prisma.trackEnrollment.findUnique({
      where: {
        userId_trackId: {
          userId: user.id,
          trackId: task.trackId,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "You are not enrolled in this bootcamp track." }, { status: 403 });
    }

    // Check deadline & closed status with student exceptions and extension deadlines
    let hasException = false;
    if (task.exceptions) {
      try {
        const exList = JSON.parse(task.exceptions);
        if (Array.isArray(exList)) {
          const match = exList.find((ex: any) =>
            typeof ex === "string"
              ? ex.toLowerCase() === user.email.toLowerCase() || ex === user.id
              : ex?.studentId === user.id || ex?.studentEmail?.toLowerCase() === user.email.toLowerCase()
          );

          if (match) {
            if (typeof match === "object" && match.until) {
              if (new Date(match.until) > new Date()) {
                hasException = true;
              }
            } else {
              hasException = true;
            }
          }
        }
      } catch {}
    }

    const isPastDeadline = new Date(task.deadline) < new Date();
    if ((task.isClosed || isPastDeadline) && !hasException) {
      return NextResponse.json(
        {
          error:
            "انتهى الموعد النهائي لتسليم هذا التكليف وتم قفل باب التسليم. يرجى التواصل مع مدرب التراك في حال وجود ظرف استثنائي.",
        },
        { status: 403 }
      );
    }

    // Upsert submission
    const submission = await prisma.taskSubmission.upsert({
      where: {
        taskId_studentId: {
          taskId,
          studentId: user.id,
        },
      },
      update: {
        solutionLink: solutionLink.trim(),
        notes: notes ? notes.trim() : null,
        submittedAt: new Date(),
      },
      create: {
        taskId,
        studentId: user.id,
        solutionLink: solutionLink.trim(),
        notes: notes ? notes.trim() : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Task solution submitted successfully!",
      submission,
    });
  } catch (error) {
    console.error("POST /api/submissions error:", error);
    return NextResponse.json({ error: "Failed to submit task solution." }, { status: 500 });
  }
}
