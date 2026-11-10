import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

export async function POST(req: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await req.json();
    const { studentId, action } = body;

    if (!studentId || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid student approval request." },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Student not found." }, { status: 404 });
    }

    if (targetUser.role === "ADMIN") {
      return NextResponse.json(
        { error: "Cannot alter status of the Main Administrator account." },
        { status: 400 }
      );
    }

    const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

    const updatedUser = await prisma.user.update({
      where: { id: studentId },
      data: { status: newStatus },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        action === "APPROVE"
          ? `Account for (${updatedUser.name}) approved successfully. Access is now unlocked.`
          : `Application for (${updatedUser.name}) was rejected.`,
      user: updatedUser,
    });
  } catch (error) {
    console.error("POST /api/admin/approve-student error:", error);
    return NextResponse.json({ error: "Failed to update student admission status." }, { status: 500 });
  }
}
