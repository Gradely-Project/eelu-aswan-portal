import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const SETTING_KEY = "hall_of_fame_items";

export async function GET(req: Request) {
  try {
    const { error, user } = await requireAuth();

    const { searchParams } = new URL(req.url);
    const filterTrack = searchParams.get("trackName");

    const setting = await prisma.systemSetting.findUnique({
      where: { key: SETTING_KEY },
    });

    let items: any[] = setting ? JSON.parse(setting.value) : [];

    if (user) {
      if (user.role === "STUDENT") {
        const studentTrackNames = user.enrollments?.map((e) => e.track.name.toLowerCase().trim()) || [];
        items = items.filter((item) => {
          const itemTrack = (item.trackName || "").toLowerCase().trim();
          return (
            itemTrack === "cross-track distinction" ||
            studentTrackNames.includes(itemTrack)
          );
        });
      } else if (user.role === "INSTRUCTOR" && user.assignedTrack?.name) {
        const assignedName = user.assignedTrack.name.toLowerCase().trim();
        items = items.filter(
          (item) => (item.trackName || "").toLowerCase().trim() === assignedName
        );
      } else if (filterTrack && filterTrack !== "ALL") {
        items = items.filter(
          (item) => (item.trackName || "").toLowerCase().trim() === filterTrack.toLowerCase().trim()
        );
      }
    }

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
      return NextResponse.json(
        { error: "Unauthorized: Only leadership & instructors can induct students into the Hall of Fame." },
        { status: 403 }
      );
    }

    const body = await req.json();
    let { studentId, studentName, trackName, badgeType, title, note } = body;

    if (!studentName || !title || !badgeType) {
      return NextResponse.json({ error: "Student name, award title, and badge type are required." }, { status: 400 });
    }

    // Instructors are strictly bound to their assigned track
    if (user.role === "INSTRUCTOR") {
      trackName = user.assignedTrack?.name || "Assigned Track";
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
      inductedBy: `${user.name} (${user.role === "INSTRUCTOR" ? user.trackTeamRole || "Lead" : user.role})`,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };

    items.unshift(newItem);

    await prisma.systemSetting.upsert({
      where: { key: SETTING_KEY },
      update: { value: JSON.stringify(items) },
      create: { key: SETTING_KEY, value: JSON.stringify(items) },
    });

    return NextResponse.json({
      success: true,
      item: newItem,
      message: `Student ${studentName} inducted into Hall of Fame successfully!`,
    });
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

    return NextResponse.json({ success: true, message: "Honoree removed from Hall of Fame." });
  } catch (error) {
    console.error("DELETE /api/hall-of-fame error:", error);
    return NextResponse.json({ error: "Failed to remove Hall of Fame entry." }, { status: 500 });
  }
}
