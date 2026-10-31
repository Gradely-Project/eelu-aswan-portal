import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error, user } = await requireAuth();
    if (error || !user) return error;

    const studentId = params.id;
    const { searchParams } = new URL(req.url);
    const filterTrackId = searchParams.get("trackId");

    // Student can only view their own activity unless Instructor / Admin / Chair
    const isStaff = ["ADMIN", "CHAIR_PERSON", "VICE_CHAIR", "INSTRUCTOR"].includes(user.role);
    if (!isStaff && user.id !== studentId) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        enrollments: {
          include: {
            track: {
              include: {
                sessions: { orderBy: { date: "desc" } },
                tasks: { orderBy: { deadline: "desc" } },
              },
            },
          },
        },
        attendances: {
          include: {
            session: { include: { track: true } },
          },
          orderBy: { markedAt: "desc" },
        },
        taskSubmissions: {
          include: {
            task: { include: { track: true } },
          },
          orderBy: { submittedAt: "desc" },
        },
        bonusPoints: {
          include: { track: true },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found." }, { status: 404 });
    }

    // Instructors are strictly restricted to students enrolled in their assigned track
    if (user.role === "INSTRUCTOR") {
      const isStudentInTrack = student.enrollments.some(
        (e) => e.trackId === user.assignedTrackId
      );
      if (!isStudentInTrack) {
        return NextResponse.json(
          { error: "Access restricted: You can only view audit reports for students in your assigned track." },
          { status: 403 }
        );
      }
    }

    // Filter by track if requested
    const relevantEnrollments =
      filterTrackId && filterTrackId !== "ALL"
        ? student.enrollments.filter((e) => e.trackId === filterTrackId)
        : student.enrollments;

    const relevantAttendances =
      filterTrackId && filterTrackId !== "ALL"
        ? student.attendances.filter((a) => a.session?.trackId === filterTrackId)
        : student.attendances;

    const relevantSubmissions =
      filterTrackId && filterTrackId !== "ALL"
        ? student.taskSubmissions.filter((s) => s.task?.trackId === filterTrackId)
        : student.taskSubmissions;

    const relevantBonus =
      filterTrackId && filterTrackId !== "ALL"
        ? student.bonusPoints.filter((b) => b.trackId === filterTrackId)
        : student.bonusPoints;

    // Build timeline of attendance across enrolled sessions
    const attendanceMap = new Map(relevantAttendances.map((a) => [a.sessionId, a]));
    const submissionMap = new Map(relevantSubmissions.map((s) => [s.taskId, s]));

    const allEnrolledSessions: any[] = [];
    const allEnrolledTasks: any[] = [];

    relevantEnrollments.forEach((en) => {
      en.track.sessions.forEach((sess) => {
        const record = attendanceMap.get(sess.id);
        allEnrolledSessions.push({
          sessionId: sess.id,
          sessionTitle: sess.title,
          trackName: en.track.name,
          date: sess.date,
          time: sess.time,
          location: sess.location,
          status: record ? record.status : "ABSENT",
          notes: record?.notes || null,
          markedAt: record?.markedAt || null,
        });
      });

      en.track.tasks.forEach((tsk) => {
        const sub = submissionMap.get(tsk.id);
        const isPastDeadline = new Date(tsk.deadline) < new Date();
        allEnrolledTasks.push({
          taskId: tsk.id,
          taskTitle: tsk.title,
          trackName: en.track.name,
          maxScore: tsk.maxScore,
          deadline: tsk.deadline,
          submitted: !!sub,
          solutionLink: sub?.solutionLink || null,
          notes: sub?.notes || null,
          score: sub?.score ?? null,
          feedback: sub?.feedback || null,
          gradedBy: sub?.gradedBy || null,
          submittedAt: sub?.submittedAt || null,
          status: sub
            ? sub.score !== null
              ? "GRADED"
              : "SUBMITTED"
            : isPastDeadline
            ? "MISSED"
            : "PENDING",
        });
      });
    });

    // Summary calculations
    const presentCount = relevantAttendances.filter((a) => a.status === "PRESENT").length;
    const lateCount = relevantAttendances.filter((a) => a.status === "LATE").length;
    const excusedCount = relevantAttendances.filter((a) => a.status === "EXCUSED").length;
    const absentCount = allEnrolledSessions.length - (presentCount + lateCount + excusedCount);

    const tasksScore = relevantSubmissions.reduce((sum, s) => sum + (s.score || 0), 0);
    const bonusScore = relevantBonus.reduce((sum, b) => sum + b.points, 0);

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        college: student.college,
        academicYear: student.academicYear,
        status: student.status,
        tracks: student.enrollments.map((e) => e.track.name),
      },
      stats: {
        totalSessions: allEnrolledSessions.length,
        presentCount,
        lateCount,
        excusedCount,
        absentCount: Math.max(0, absentCount),
        attendanceRate:
          allEnrolledSessions.length > 0
            ? Math.round(((presentCount + lateCount * 0.5) / allEnrolledSessions.length) * 100)
            : 100,
        totalTasks: allEnrolledTasks.length,
        submittedTasks: relevantSubmissions.length,
        tasksScore,
        bonusScore,
      },
      attendanceHistory: allEnrolledSessions,
      taskSubmissions: allEnrolledTasks,
      bonusHistory: relevantBonus,
    });
  } catch (error) {
    console.error("GET /api/reports/student/[id] error:", error);
    return NextResponse.json({ error: "Failed to generate student activity report." }, { status: 500 });
  }
}
