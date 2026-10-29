import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTrackAccess } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required." }, { status: 400 });
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { track: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    const { error, user } = await requireTrackAccess(session.trackId);
    if (error) return error;

    const isStaff = user && ["ADMIN", "CHAIR_PERSON", "VICE_CHAIR", "INSTRUCTOR"].includes(user.role);
    const sanitizedSession = {
      ...session,
      checkInCode: isStaff && session.checkInCode ? session.checkInCode.split(",")[0] : null,
    };

    // Fetch approved students (if student, strictly restrict to their own record for privacy!)
    const studentWhereClause: any = {
      role: "STUDENT",
      status: "APPROVED",
      enrollments: {
        some: { trackId: session.trackId },
      },
    };

    if (user?.role === "STUDENT") {
      studentWhereClause.id = user.id;
    }

    const enrolledStudents = await prisma.user.findMany({
      where: studentWhereClause,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        college: true,
        academicYear: true,
      },
      orderBy: { name: "asc" },
    });

    // Fetch existing attendance records
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: { sessionId },
    });

    const attendanceMap = new Map(attendanceRecords.map((r) => [r.studentId, r]));

    const list = enrolledStudents.map((st) => {
      const rec = attendanceMap.get(st.id);
      return {
        student: st,
        status: rec ? rec.status : "ABSENT",
        isMarked: !!rec,
        notes: rec?.notes || "",
        markedAt: rec?.markedAt || null,
        verificationMethod: rec?.verificationMethod || (rec ? "MANUAL" : null),
        verifiedBy: rec?.verifiedBy || (rec ? "Staff" : null),
      };
    });

    return NextResponse.json({
      session: sanitizedSession,
      students: list,
      stats: {
        total: enrolledStudents.length,
        present: list.filter((s) => s.status === "PRESENT").length,
        late: list.filter((s) => s.status === "LATE").length,
        excused: list.filter((s) => s.status === "EXCUSED").length,
        absent: list.filter((s) => s.status === "ABSENT").length,
      },
    });
  } catch (error) {
    console.error("GET /api/attendance error:", error);
    return NextResponse.json({ error: "Failed to load attendance list." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, records } = body;

    if (!sessionId || !records || !Array.isArray(records)) {
      return NextResponse.json({ error: "Incomplete attendance payload." }, { status: 400 });
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    const { error, canEdit, user } = await requireTrackAccess(session.trackId);
    if (error) return error;
    if (!canEdit) {
      return NextResponse.json({ error: "Unauthorized: You do not have permission to record attendance for this track." }, { status: 403 });
    }

    const validStatuses = ["PRESENT", "LATE", "EXCUSED", "ABSENT"];
    const verifierRole = user?.role === "ADMIN" ? "ADMIN" : user?.role === "INSTRUCTOR" ? "INSTRUCTOR" : (user?.role || "STAFF");
    const verifierLabel = user ? `${user.name} (${user.role})` : "Staff / Instructor";

    // Save attendance using transaction
    const operations = records.map((rec: { studentId: string; status: string; notes?: string }) => {
      const sanitizedStatus = validStatuses.includes(rec.status) ? rec.status : "ABSENT";
      return prisma.attendanceRecord.upsert({
        where: {
          sessionId_studentId: {
            sessionId,
            studentId: rec.studentId,
          },
        },
        update: {
          status: sanitizedStatus,
          notes: rec.notes || null,
          markedAt: new Date(),
          verificationMethod: verifierRole,
          verifiedBy: verifierLabel,
        },
        create: {
          sessionId,
          studentId: rec.studentId,
          status: sanitizedStatus,
          notes: rec.notes || null,
          verificationMethod: verifierRole,
          verifiedBy: verifierLabel,
        },
      });
    });

    await prisma.$transaction(operations);

    return NextResponse.json({
      success: true,
      message: "Classroom attendance has been saved and synchronized successfully.",
    });
  } catch (error) {
    console.error("POST /api/attendance error:", error);
    return NextResponse.json({ error: "Failed to save attendance." }, { status: 500 });
  }
}
