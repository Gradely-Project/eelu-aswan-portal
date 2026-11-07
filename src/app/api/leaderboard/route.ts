import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTrackAccess, requireAuth } from "@/lib/permissions";

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

    const track = await prisma.track.findUnique({
      where: { id: trackId },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found." }, { status: 404 });
    }

    // Check Anonymous Mode Setting
    const anonSetting = await prisma.systemSetting.findUnique({
      where: { key: "leaderboard_anonymous_mode" },
    });
    const isAnonymousMode = anonSetting?.value === "true";

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
            awardedBy: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
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

    // Sort descending by total score, then tiebreak by tasks, then attendance, then name
    leaderboard.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      if (b.tasksScore !== a.tasksScore) return b.tasksScore - a.tasksScore;
      if (b.attendanceScore !== a.attendanceScore) return b.attendanceScore - a.attendanceScore;
      return a.name.localeCompare(b.name);
    });

    // Assign Fair Competition Ranking (Students with identical scores share the exact same rank)
    let currentRank = 1;
    const rankedLeaderboard = leaderboard.map((st, index, arr) => {
      if (index > 0 && st.totalScore === arr[index - 1].totalScore) {
        // Shared rank with predecessor
      } else {
        currentRank = index + 1;
      }
      return {
        ...st,
        rank: currentRank,
      };
    });

    // If Anonymous Mode is ON and the requester is a student, mask all OTHER students
    const finalLeaderboard = rankedLeaderboard.map((st) => {
      if (isAnonymousMode && user.role === "STUDENT" && st.id !== user.id) {
        return {
          ...st,
          name: `Participant #${st.rank} (مشارك)`,
          email: "masked@academy.internal",
          phone: null,
          college: "Confidential",
          academicYear: "-",
        };
      }
      return st;
    });

    return NextResponse.json(
      {
        track,
        settings,
        isAnonymousMode,
        stats: {
          totalStudents: students.length,
          totalSessions,
          totalTasks,
        },
        leaderboard: finalLeaderboard,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/leaderboard error:", error);
    return NextResponse.json({ error: "Failed to load leaderboard." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { error, user } = await requireAuth();
    if (error || !user) return error;

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized: Only Main Administrator can configure leaderboard anonymous mode." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { anonymousMode } = body;

    await prisma.systemSetting.upsert({
      where: { key: "leaderboard_anonymous_mode" },
      update: { value: anonymousMode ? "true" : "false" },
      create: { key: "leaderboard_anonymous_mode", value: anonymousMode ? "true" : "false" },
    });

    return NextResponse.json({
      success: true,
      anonymousMode: !!anonymousMode,
      message: anonymousMode
        ? "Anonymous Leaderboard Mode enabled. Other students are now masked from student view."
        : "Standard Leaderboard Mode restored. Student names are now visible to everyone.",
    });
  } catch (error) {
    console.error("POST /api/leaderboard error:", error);
    return NextResponse.json({ error: "Failed to update leaderboard settings." }, { status: 500 });
  }
}
