import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { error, user } = await requireAuth();
    if (error || !user) return error;

    const body = await req.json();
    const { newPassword, confirmPassword, phone } = body;

    const updateData: any = {};

    // Update phone if supplied
    if (phone !== undefined) {
      updateData.phone = phone.trim();
    }

    // Update password if supplied
    if (newPassword && newPassword.trim() !== "") {
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "New password must be at least 6 characters." },
          { status: 400 }
        );
      }

      if (confirmPassword && newPassword !== confirmPassword) {
        return NextResponse.json(
          { error: "New passwords do not match." },
          { status: 400 }
        );
      }

      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Please provide a new password or phone number to update." },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: "Account profile and credentials updated successfully.",
    });
  } catch (err) {
    console.error("Profile/password update error:", err);
    return NextResponse.json(
      { error: "Failed to update account details." },
      { status: 500 }
    );
  }
}
