import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrChair } from "@/lib/permissions";

export async function GET() {
  try {
    const setting = await prisma.scoreSetting.upsert({
      where: { id: "default" },
      update: {},
      create: {
        id: "default",
        attendancePoints: 10.0,
        taskWeight: 1.0,
        bonusWeight: 1.0,
      },
    });

    return NextResponse.json({ setting });
  } catch (error) {
    console.error("GET /api/admin/scoring error:", error);
    return NextResponse.json({ error: "Failed to fetch scoring rules." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { error } = await requireAdminOrChair();
    if (error) return error;

    const body = await req.json();
    const { attendancePoints, taskWeight, bonusWeight } = body;

    const updated = await prisma.scoreSetting.upsert({
      where: { id: "default" },
      update: {
        attendancePoints: Number(attendancePoints) || 10,
        taskWeight: Number(taskWeight) || 1.0,
        bonusWeight: Number(bonusWeight) || 1.0,
      },
      create: {
        id: "default",
        attendancePoints: Number(attendancePoints) || 10,
        taskWeight: Number(taskWeight) || 1.0,
        bonusWeight: Number(bonusWeight) || 1.0,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Leaderboard scoring rules updated successfully.",
      setting: updated,
    });
  } catch (error) {
    console.error("POST /api/admin/scoring error:", error);
    return NextResponse.json({ error: "Failed to save scoring rules." }, { status: 500 });
  }
}
