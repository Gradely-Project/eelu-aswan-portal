import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTrackAccess } from "@/lib/permissions";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { submissionId, score, feedback } = body;

    if (!submissionId || score === undefined || score === null) {
      return NextResponse.json({ error: "Submission ID and score are required." }, { status: 400 });
    }

    const submission = await prisma.taskSubmission.findUnique({
      where: { id: submissionId },
      include: {
        task: true,
        student: { select: { name: true } },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }

    const { error, user, canEdit } = await requireTrackAccess(submission.task.trackId);
    if (error || !user) return error;
    if (!canEdit) {
      return NextResponse.json({ error: "Unauthorized to grade submissions in this track." }, { status: 403 });
    }

    const numericScore = Number(score);
    if (numericScore < 0 || numericScore > submission.task.maxScore) {
      return NextResponse.json(
        { error: `Score must be between 0 and ${submission.task.maxScore}.` },
        { status: 400 }
      );
    }

    let graderRoleTitle = "Main Admin";
    if (user.role === "CHAIR_PERSON") {
      graderRoleTitle = "Branch Chairperson";
    } else if (user.role === "VICE_CHAIR") {
      graderRoleTitle = "Vice Chairperson";
    } else if (user.role === "INSTRUCTOR") {
      if (user.trackTeamRole === "HEAD") graderRoleTitle = "Track Head";
      else if (user.trackTeamRole === "VICE_HEAD") graderRoleTitle = "Vice Head";
      else if (user.trackTeamRole === "CORE_TEAM") graderRoleTitle = "Core Team";
      else graderRoleTitle = "Instructor";
    }

    const updated = await prisma.taskSubmission.update({
      where: { id: submissionId },
      data: {
        score: numericScore,
        feedback: feedback ? feedback.trim() : null,
        gradedAt: new Date(),
        gradedBy: user.name,
        gradedByRole: graderRoleTitle,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Score recorded for (${submission.student.name}): ${numericScore}/${submission.task.maxScore}`,
      submission: updated,
    });
  } catch (error) {
    console.error("POST /api/submissions/grade error:", error);
    return NextResponse.json({ error: "Failed to save submission grade." }, { status: 500 });
  }
}
