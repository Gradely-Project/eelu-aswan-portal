import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { error, user } = await requireAdmin();
    if (error || !user) return error;

    // Fetch all evaluations with their session and track details
    const evaluations = await prisma.sessionEvaluation.findMany({
      orderBy: { createdAt: "desc" },
    });

    const sessions = await prisma.session.findMany({
      include: {
        track: { select: { id: true, name: true } },
      },
    });

    const sessionMap = new Map(sessions.map((s) => [s.id, s]));

    // Aggregate by instructor
    const instructorStats: {
      [key: string]: {
        instructorName: string;
        instructorRole: string;
        trackName: string;
        totalReviews: number;
        clarityTotal: number;
        materialTotal: number;
        overallTotal: number;
        feedbacks: Array<{
          studentName: string | null;
          comment: string;
          overall: number;
          sessionTitle: string;
          date: string;
        }>;
      };
    } = {};

    for (const ev of evaluations) {
      const sess = sessionMap.get(ev.sessionId);
      const name = ev.instructorName || "Unassigned Instructor";
      const role = ev.instructorRole || "Instruction Team";
      const trackName = sess?.track?.name || "General Track";

      const key = `${name}___${trackName}`;

      if (!instructorStats[key]) {
        instructorStats[key] = {
          instructorName: name,
          instructorRole: role,
          trackName,
          totalReviews: 0,
          clarityTotal: 0,
          materialTotal: 0,
          overallTotal: 0,
          feedbacks: [],
        };
      }

      instructorStats[key].totalReviews += 1;
      instructorStats[key].clarityTotal += ev.clarityRating;
      instructorStats[key].materialTotal += ev.materialRating;
      instructorStats[key].overallTotal += ev.overallRating;

      if (ev.feedbackText && ev.feedbackText.trim() !== "") {
        instructorStats[key].feedbacks.push({
          studentName: ev.studentName,
          comment: ev.feedbackText,
          overall: ev.overallRating,
          sessionTitle: sess?.title || "Session",
          date: ev.createdAt.toISOString().split("T")[0],
        });
      }
    }

    const report = Object.values(instructorStats).map((stat) => ({
      instructorName: stat.instructorName,
      instructorRole: stat.instructorRole,
      trackName: stat.trackName,
      totalReviews: stat.totalReviews,
      avgClarity: Number((stat.clarityTotal / stat.totalReviews).toFixed(1)),
      avgMaterial: Number((stat.materialTotal / stat.totalReviews).toFixed(1)),
      avgOverall: Number((stat.overallTotal / stat.totalReviews).toFixed(1)),
      feedbacks: stat.feedbacks,
    }));

    // Sort by overall average descending
    report.sort((a, b) => b.avgOverall - a.avgOverall);

    return NextResponse.json({
      success: true,
      instructorsReport: report,
      totalEvaluations: evaluations.length,
    });
  } catch (err) {
    console.error("GET /api/admin/instructor-evaluations error:", err);
    return NextResponse.json(
      { error: "Failed to generate instructor evaluations report." },
      { status: 500 }
    );
  }
}
