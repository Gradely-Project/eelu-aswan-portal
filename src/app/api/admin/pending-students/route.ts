import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { error, user } = await requireAuth();
    if (error || !user) return error;

    if (!["ADMIN", "CHAIR_PERSON", "VICE_CHAIR", "INSTRUCTOR"].includes(user.role)) {
      return NextResponse.json({ error: "Access restricted to authorized branch staff." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const filterStatus = searchParams.get("status"); // "PENDING", "APPROVED", "SUSPENDED", "REJECTED", or null for all

    const whereClause: any = { role: "STUDENT" };
    if (filterStatus && filterStatus !== "ALL") {
      whereClause.status = filterStatus;
    }

    // If INSTRUCTOR, strictly restrict to students enrolled in their assigned track
    if (user.role === "INSTRUCTOR") {
      if (!user.assignedTrackId) {
        return NextResponse.json({
          students: [],
          stats: { totalCount: 0, pendingCount: 0, approvedCount: 0, suspendedCount: 0, rejectedCount: 0 },
        });
      }
      whereClause.enrollments = {
        some: { trackId: user.assignedTrackId },
      };
    }

    const students = await prisma.user.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        enrollments: {
          include: {
            track: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    const baseStatsWhere: any = { role: "STUDENT" };
    if (user.role === "INSTRUCTOR") {
      baseStatsWhere.enrollments = { some: { trackId: user.assignedTrackId } };
    }

    const pendingCount = await prisma.user.count({ where: { ...baseStatsWhere, status: "PENDING" } });
    const approvedCount = await prisma.user.count({ where: { ...baseStatsWhere, status: "APPROVED" } });
    const suspendedCount = await prisma.user.count({ where: { ...baseStatsWhere, status: "SUSPENDED" } });
    const rejectedCount = await prisma.user.count({ where: { ...baseStatsWhere, status: "REJECTED" } });
    const totalCount = await prisma.user.count({ where: baseStatsWhere });

    return NextResponse.json({
      students,
      stats: {
        totalCount,
        pendingCount,
        approvedCount,
        suspendedCount,
        rejectedCount,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/pending-students error:", error);
    return NextResponse.json({ error: "Failed to fetch student directory." }, { status: 500 });
  }
}
