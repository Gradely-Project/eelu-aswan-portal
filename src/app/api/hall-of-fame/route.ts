import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const SETTING_KEY = "hall_of_fame_items";

export async function GET() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: SETTING_KEY },
    });

    const items = setting ? JSON.parse(setting.value) : [];
    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error("GET /api/hall-of-fame error:", error);
    return NextResponse.json({ error: "Failed to fetch Hall of Fame records." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { error, user } = await requireAuth();
    if (error || !user) return error;

    const canNominate = ["ADMIN", "CHAIR_PERSON", "VICE_CHAIR", "INSTRUCTOR"].includes(user.role);
    if (!canNominate) {
      return NextResponse.json({ error: "Unauthorized: Only leadership & instructors can induct students into the Hall of Fame." }, { status: 403 });
    }

    const body = await req.json();
    const { studentId, studentName, trackName, badgeType, title, note } = body;

    if (!studentName || !title || !badgeType) {
      return NextResponse.json({ error: "Student name, award title, and badge type are required." }, { status: 400 });
    }

    const setting = await prisma.systemSetting.findUnique({
      where: { key: SETTING_KEY },
    });

    const items = setting ? JSON.parse(setting.value) : [];

    const newItem = {
      id: "hof_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      studentId: studentId || null,
      studentName,
      trackName: trackName || "Cross-Track Distinction",
      badgeType, // CHAMPION, FASTEST, STAR, DISTINCTION
      title,
      note: note || "",
      inductedBy: `${user.name} (${user.role})`,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };

    items.unshift(newItem);

    await prisma.systemSetting.upsert({
      where: { key: SETTING_KEY },
      update: { value: JSON.stringify(items) },
      create: { key: SETTING_KEY, value: JSON.stringify(items) },
    });

    return NextResponse.json({ success: true, item: newItem, message: `Student ${studentName} inducted into Hall of Fame successfully!` });
  } catch (error) {
    console.error("POST /api/hall-of-fame error:", error);
    return NextResponse.json({ error: "Failed to induct student into Hall of Fame." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { error, user } = await requireAuth();
    if (error || !user) return error;

    const canDelete = ["ADMIN", "CHAIR_PERSON", "VICE_CHAIR"].includes(user.role);
    if (!canDelete) {
      return NextResponse.json({ error: "Unauthorized: Only main leadership can delete Hall of Fame entries." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Item ID is required." }, { status: 400 });
    }

    const setting = await prisma.systemSetting.findUnique({
      where: { key: SETTING_KEY },
    });

    if (!setting) {
      return NextResponse.json({ success: true });
    }

    let items = JSON.parse(setting.value);
    items = items.filter((item: any) => item.id !== id);

    await prisma.systemSetting.update({
      where: { key: SETTING_KEY },
      data: { value: JSON.stringify(items) },
    });

    return NextResponse.json({ success: true, message: "Hall of Fame entry removed." });
  } catch (error) {
    console.error("DELETE /api/hall-of-fame error:", error);
    return NextResponse.json({ error: "Failed to delete Hall of Fame entry." }, { status: 500 });
  }
}
