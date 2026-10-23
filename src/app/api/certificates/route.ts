import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { error, user } = await requireAuth();
    if (error || !user) return error;

    if (user.role === "STUDENT") {
      // Return student's own issued certificates
      const myCertificates = await prisma.certificate.findMany({
        where: { studentId: user.id },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ certificates: myCertificates });
    }

    const isExec = ["ADMIN", "CHAIR_PERSON"].includes(user.role);
    if (!isExec) {
      return NextResponse.json({ error: "Access restricted to Executive Leadership." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const trackId = searchParams.get("trackId");

    const whereClause: any = {};
    if (trackId && trackId !== "ALL") {
      whereClause.trackId = trackId;
    }

    const certificates = await prisma.certificate.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    // Also return list of students for selection
    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        status: "APPROVED",
        ...(trackId && trackId !== "ALL"
          ? { enrollments: { some: { trackId } } }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        enrollments: {
          include: { track: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ certificates, students });
  } catch (error) {
    console.error("GET /api/certificates error:", error);
    return NextResponse.json({ error: "Failed to load certificates." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { error, user } = await requireAuth();
    if (error || !user) return error;

    const isExec = ["ADMIN", "CHAIR_PERSON"].includes(user.role);
    if (!isExec) {
      return NextResponse.json({ error: "Only the Main Administrator and Chairperson can issue certificates." }, { status: 403 });
    }

    const body = await req.json();
    const { studentId, trackId, grade, issueDate, supervisorName, chairName } = body;

    if (!studentId || !trackId) {
      return NextResponse.json({ error: "Please select student and track." }, { status: 400 });
    }

    const student = await prisma.user.findUnique({
      where: { id: studentId },
    });
    const track = await prisma.track.findUnique({
      where: { id: trackId },
    });

    if (!student || !track) {
      return NextResponse.json({ error: "Student or Track not found." }, { status: 404 });
    }

    // High-entropy Unique Certificate Number (e.g. EELU-ASW-WEB-2026-849201)
    const suffix = `${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
    const trackCode = track.name.replace(/[^A-Za-z]/g, "").substring(0, 3).toUpperCase() || "ENG";
    const certNo = `EELU-ASW-${trackCode}-${new Date().getFullYear()}-${suffix}`;

    const certificate = await prisma.certificate.create({
      data: {
        studentId,
        studentName: student.name,
        studentEmail: student.email,
        trackId,
        trackName: track.name,
        certificateNo: certNo,
        grade: grade || "Distinction",
        issueDate: issueDate || new Date().toISOString().split("T")[0],
        supervisorName: supervisorName || "Eng. Abdelrahman Mahmoud",
        chairName: chairName || "EELU Aswan Branch Board",
      },
    });

    return NextResponse.json({
      success: true,
      certificate,
      message: `Official certificate for ${student.name} generated successfully (#${certNo}).`,
    });
  } catch (error) {
    console.error("POST /api/certificates error:", error);
    return NextResponse.json({ error: "Failed to issue certificate." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { error, user } = await requireAuth();
    if (error || !user) return error;

    const isExec = ["ADMIN", "CHAIR_PERSON"].includes(user.role);
    if (!isExec) {
      return NextResponse.json({ error: "Access restricted." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Certificate ID is required." }, { status: 400 });
    }

    await prisma.certificate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Certificate revoked successfully." });
  } catch (err) {
    console.error("DELETE /api/certificates error:", err);
    return NextResponse.json({ error: "Failed to delete certificate." }, { status: 500 });
  }
}
