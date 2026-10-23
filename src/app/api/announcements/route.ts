import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { error, user } = await requireAuth();
    if (error || !user) return error;

    const { searchParams } = new URL(req.url);
    const trackIdParam = searchParams.get("trackId");

    let whereClause: any = {};

    if (user.role === "STUDENT") {
      const studentTrackIds = user.enrollments?.map((e) => e.trackId) || [];
      // Student sees global announcements (trackId is null) + announcements for their enrolled tracks
      whereClause = {
        OR: [{ trackId: null }, { trackId: { in: studentTrackIds } }],
      };
    } else if (user.role === "INSTRUCTOR") {
      if (user.assignedTrackId) {
        whereClause = {
          OR: [{ trackId: null }, { trackId: user.assignedTrackId }],
        };
      }
    } else {
      // Admin / Chair / Vice Chair
      if (trackIdParam && trackIdParam !== "ALL") {
        whereClause.trackId = trackIdParam;
      }
    }

    const announcements = await prisma.announcement.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error("GET /api/announcements error:", error);
    return NextResponse.json({ error: "Failed to load announcements." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { error, user } = await requireAuth();
    if (error || !user) return error;

    const isStaff = ["ADMIN", "CHAIR_PERSON", "VICE_CHAIR", "INSTRUCTOR"].includes(user.role);
    if (!isStaff) {
      return NextResponse.json({ error: "Unauthorized. Staff only." }, { status: 403 });
    }

    const body = await req.json();
    const { title, content, category, trackId } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required." }, { status: 400 });
    }

    let finalTrackId = trackId || null;
    if (user.role === "INSTRUCTOR") {
      // Instructors can only broadcast to their assigned track
      finalTrackId = user.assignedTrackId;
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        category: category || "GENERAL",
        trackId: finalTrackId,
        authorName: `${user.name} (${user.role === "INSTRUCTOR" ? "Track Lead" : "Administration"})`,
      },
    });

    return NextResponse.json({
      success: true,
      announcement,
      message: "Announcement broadcasted successfully to student dashboards.",
    });
  } catch (error) {
    console.error("POST /api/announcements error:", error);
    return NextResponse.json({ error: "Failed to broadcast announcement." }, { status: 500 });
  }
}
