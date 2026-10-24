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

    const { error } = await requireTrackAccess(trackId);
    if (error) return error;

    const track = await prisma.track.findUnique({
      where: { id: trackId },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found." }, { status: 404 });
    }

    // Get score settings
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

    // Total sessions in this track
    const totalSessions = await prisma.session.count({
      where: { trackId },
    });

    // Total tasks in this track
    const totalTasks = await prisma.task.count({
      where: { trackId },
    });

    // Enrolled approved students in this track
    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        status: "APPROVED",
        enrollments: {
          some: { trackId },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        college: true,
        academicYear: true,
        attendances: {
          where: {
            session: { trackId },
          },
          select: {
            status: true,
          },
        },
        taskSubmissions: {
          where: {
            task: { trackId },
            score: { not: null },
          },
          select: {
            score: true,
            task: { select: { title: true, maxScore: true } },
          },
        },
        bonusPoints: {
          where: { trackId },
          select: {
            id: true,
            points: true,
            reason: true,
            createdAt: true,
          },
        },
      },
    });

    // Calculate scores for each student
    const leaderboard = students.map((st) => {
      // Attendance
      const presentCount = st.attendances.filter((a) => a.status === "PRESENT").length;
      const absentCount = st.attendances.filter((a) => a.status === "ABSENT").length;
      const excusedCount = st.attendances.filter((a) => a.status === "EXCUSED").length;
      const attendanceScore = presentCount * settings.attendancePoints;
      const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 100;

      // Tasks
      const tasksSum = st.taskSubmissions.reduce((sum, sub) => sum + (sub.score || 0), 0);
      const tasksScore = Math.round(tasksSum * settings.taskWeight * 10) / 10;
      const submittedTasksCount = st.taskSubmissions.length;

      // Bonus
      const bonusSum = st.bonusPoints.reduce((sum, b) => sum + b.points, 0);
      const bonusScore = Math.round(bonusSum * settings.bonusWeight * 10) / 10;

      // Total
      const totalScore = Math.round((attendanceScore + tasksScore + bonusScore) * 10) / 10;

      return {
        id: st.id,
        name: st.name,
        email: st.email,
        phone: st.phone,
        college: st.college,
        academicYear: st.academicYear,
        presentCount,
        absentCount,
        excusedCount,
        attendanceRate,
        attendanceScore,
        submittedTasksCount,
        tasksScore,
        bonusScore,
        bonusList: st.bonusPoints,
        totalScore,
      };
    });

    // Sort descending by total score
    leaderboard.sort((a, b) => b.totalScore - a.totalScore);

    // Assign rank
    const rankedLeaderboard = leaderboard.map((st, index) => ({
      ...st,
      rank: index + 1,
    }));

    return NextResponse.json({
      track,
      settings,
      stats: {
        totalStudents: students.length,
        totalSessions,
        totalTasks,
      },
      leaderboard: rankedLeaderboard,
    });
  } catch (error) {
    console.error("GET /api/leaderboard error:", error);
    return NextResponse.json({ error: "Failed to load leaderboard." }, { status: 500 });
  }
}
