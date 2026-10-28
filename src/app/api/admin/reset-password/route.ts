import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { error, user } = await requireAdmin();
    if (error || !user) return error;

    const body = await req.json();
    const { studentId, newPassword } = body;

    if (!studentId || !newPassword || newPassword.trim().length < 6) {
      return NextResponse.json(
        { error: "Please provide the student ID and a new password with at least 6 characters." },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Student not found." }, { status: 404 });
    }

    const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);

    await prisma.user.update({
      where: { id: studentId },
      data: {
        password: hashedPassword,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Password for "${targetUser.name}" has been updated successfully.`,
    });
  } catch (error) {
    console.error("POST /api/admin/reset-password error:", error);
    return NextResponse.json({ error: "Failed to reset password." }, { status: 500 });
  }
}
