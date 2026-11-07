import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await req.json();
    const { studentId, action } = body; // action: "SUSPEND" | "REACTIVATE"

    if (!studentId || !["SUSPEND", "REACTIVATE"].includes(action)) {
      return NextResponse.json({ error: "Invalid parameters." }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, role: true, name: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (targetUser.role === "ADMIN") {
      return NextResponse.json({ error: "Cannot suspend the Main Administrator account." }, { status: 400 });
    }

    const newStatus = action === "SUSPEND" ? "SUSPENDED" : "APPROVED";

    const user = await prisma.user.update({
      where: { id: studentId },
      data: { status: newStatus },
      select: { id: true, name: true, email: true, status: true },
    });

    return NextResponse.json({
      success: true,
      message:
        action === "SUSPEND"
          ? `Account for ${user.name} has been suspended.`
          : `Account for ${user.name} has been reactivated.`,
      user,
    });
  } catch (error) {
    console.error("POST /api/admin/suspend-student error:", error);
    return NextResponse.json({ error: "Failed to update account status." }, { status: 500 });
  }
}
