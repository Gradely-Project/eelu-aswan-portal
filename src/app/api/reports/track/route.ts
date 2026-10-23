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

    const { error, canEdit, user } = await requireTrackAccess(trackId);
    if (error || !user) return error;

    // Track details & team
    const track = await prisma.track.findUnique({
      where: { id: trackId },
      include: {
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

    if (!track) {
      return NextResponse.json({ error: "Track not found." }, { status: 404 });
    }

    const settings = await prisma.scoreSetting.upsert({
      where: { id: "default" },
      update: {},
      create: {
        id: "default",
        attendancePoints: 10.0,
        taskWeight: 1.0,
        bonusWeight: 1.0,
      },
    });

    // All sessions in track
    const sessions = await prisma.session.findMany({
      where: { trackId },
      orderBy: { date: "asc" },
      select: {
        id: true,
        title: true,
        date: true,
      },
    });

    // All tasks in track
    const tasks = await prisma.task.findMany({
      where: { trackId },
      orderBy: { deadline: "asc" },
      select: {
        id: true,
        title: true,
        maxScore: true,
      },
    });

    // Enrolled approved students
    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        status: "APPROVED",
        enrollments: {
          some: { trackId },
        },
      },
      include: {
        attendances: {
          where: { session: { trackId } },
        },
        taskSubmissions: {
          where: { task: { trackId } },
        },
        bonusPoints: {
          where: { trackId },
        },
      },
      orderBy: { name: "asc" },
    });

    // Build comprehensive report rows
    const reportRows = students.map((st) => {
      // Attendance map
      const attendanceMap = new Map(st.attendances.map((a) => [a.sessionId, a.status]));
      const presentCount = st.attendances.filter((a) => a.status === "PRESENT").length;
      const attendanceScore = presentCount * settings.attendancePoints;
      const attendanceRate = sessions.length > 0 ? Math.round((presentCount / sessions.length) * 100) : 100;

      // Tasks map
      const taskMap = new Map(st.taskSubmissions.map((s) => [s.taskId, s.score]));
      const tasksSum = st.taskSubmissions.reduce((sum, s) => sum + (s.score || 0), 0);
      const tasksScore = Math.round(tasksSum * settings.taskWeight * 10) / 10;

      // Bonus
      const bonusScore = Math.round(st.bonusPoints.reduce((sum, b) => sum + b.points, 0) * settings.bonusWeight * 10) / 10;

      // Total
      const totalScore = Math.round((attendanceScore + tasksScore + bonusScore) * 10) / 10;

      return {
        id: st.id,
        name: st.name,
        email: st.email,
        phone: st.phone || "-",
        college: st.college || "-",
        academicYear: st.academicYear || "-",
        presentCount,
        attendanceRate,
        attendanceScore,
        attendanceBySession: sessions.map((sess) => ({
          sessionId: sess.id,
          status: attendanceMap.get(sess.id) || "ABSENT",
        })),
        tasksScore,
        taskScores: tasks.map((t) => ({
          taskId: t.id,
          score: taskMap.get(t.id) ?? "-",
        })),
        bonusScore,
        totalScore,
      };
    });

    // Sort by totalScore descending for ranking
    const sorted = [...reportRows].sort((a, b) => b.totalScore - a.totalScore);
    const rankedRows = sorted.map((row, idx) => ({
      ...row,
      rank: idx + 1,
    }));

    return NextResponse.json({
      track,
      sessions,
      tasks,
      settings,
      reportRows: rankedRows,
      generatedAt: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    });
  } catch (error) {
    console.error("GET /api/reports/track error:", error);
    return NextResponse.json({ error: "Failed to generate report." }, { status: 500 });
  }
}
