import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/permissions";

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
    const filterTrackId = searchParams.get("trackId");

    const whereClause: any = { role: "STUDENT" };
    if (filterStatus && filterStatus !== "ALL") {
      whereClause.status = filterStatus;
    }

    const baseStatsWhere: any = { role: "STUDENT" };

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
      baseStatsWhere.enrollments = {
        some: { trackId: user.assignedTrackId },
      };
    } else if (filterTrackId && filterTrackId !== "ALL") {
      whereClause.enrollments = {
        some: { trackId: filterTrackId },
      };
      baseStatsWhere.enrollments = {
        some: { trackId: filterTrackId },
      };
    }

    const students = await prisma.user.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        college: true,
        academicYear: true,
        universityId: true,
        universityEmail: true,
        assignedTrackId: true,
        lastLoginAt: true,
        createdAt: true,
        enrollments: {
          select: {
            id: true,
            trackId: true,
            track: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

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

export async function DELETE(req: Request) {
  try {
    const { error, user } = await requireAdmin();
    if (error || !user) return error;

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required." }, { status: 400 });
    }

    const targetStudent = await prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!targetStudent) {
      return NextResponse.json({ error: "Student not found." }, { status: 404 });
    }

    // Permanently delete all cascading records
    await prisma.attendanceRecord.deleteMany({ where: { studentId } });
    await prisma.taskSubmission.deleteMany({ where: { studentId } });
    await prisma.bonusPoint.deleteMany({ where: { studentId } });
    await prisma.trackEnrollment.deleteMany({ where: { userId: studentId } });
    await prisma.sessionEvaluation.deleteMany({ where: { studentId } });
    await prisma.certificate.deleteMany({ where: { studentId } });

    await prisma.user.delete({
      where: { id: studentId },
    });

    return NextResponse.json({
      success: true,
      message: `Account for "${targetStudent.name}" permanently deleted from database.`,
    });
  } catch (error) {
    console.error("DELETE /api/admin/pending-students error:", error);
    return NextResponse.json({ error: "Failed to permanently delete student." }, { status: 500 });
  }
}
