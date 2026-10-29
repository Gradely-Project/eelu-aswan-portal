import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireTrackAccess } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { error: authError, user } = await requireAuth();
    if (authError || !user) return authError;

    const { searchParams } = new URL(req.url);
    const requestedTrackId = searchParams.get("trackId");

    let whereClause: any = {};

    if (user.role === "INSTRUCTOR") {
      // Instructors are strictly locked to their assigned track
      if (!user.assignedTrackId) {
        return NextResponse.json({ sessions: [] });
      }
      whereClause.trackId = user.assignedTrackId;
    } else if (user.role === "STUDENT") {
      // Students see sessions for tracks they are enrolled in
      const enrolledTrackIds = user.enrollments?.map((e) => e.trackId) || [];
      if (requestedTrackId && requestedTrackId !== "ALL") {
        if (!enrolledTrackIds.includes(requestedTrackId)) {
          return NextResponse.json({ error: "Not enrolled in this track." }, { status: 403 });
        }
        whereClause.trackId = requestedTrackId;
      } else {
        whereClause.trackId = { in: enrolledTrackIds };
      }
    } else {
      // ADMIN, CHAIR_PERSON, VICE_CHAIR
      if (requestedTrackId && requestedTrackId !== "ALL") {
        whereClause.trackId = requestedTrackId;
      }
    }

    const sessions = await prisma.session.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
      include: {
        track: {
          select: {
            id: true,
            name: true,
            instructors: {
              select: {
                id: true,
                name: true,
                trackTeamRole: true,
              },
            },
          },
        },
        _count: {
          select: { attendance: true },
        },
      },
    });

    const isStaff = ["ADMIN", "CHAIR_PERSON", "VICE_CHAIR", "INSTRUCTOR"].includes(user.role);
    const sanitizedSessions = sessions.map((sess) => ({
      ...sess,
      checkInCode: isStaff ? sess.checkInCode : null,
      codeExpiresAt: isStaff ? sess.codeExpiresAt : null,
    }));

    return NextResponse.json({ sessions: sanitizedSessions });
  } catch (error) {
    console.error("GET /api/sessions error:", error);
    return NextResponse.json({ error: "Failed to load sessions." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { trackId, title, description, date, time, location, materials } = body;

    if (!trackId || !title || !date) {
      return NextResponse.json(
        { error: "Please provide the track, session title, and date." },
        { status: 400 }
      );
    }

    const { error, canEdit } = await requireTrackAccess(trackId);
    if (error) return error;
    if (!canEdit) {
      return NextResponse.json({ error: "Unauthorized to add sessions in this track." }, { status: 403 });
    }

    const session = await prisma.session.create({
      data: {
        trackId,
        title: title.trim(),
        description: description ? description.trim() : null,
        date: date.trim(),
        time: time ? time.trim() : null,
        location: location ? location.trim() : null,
        materials: materials ? (typeof materials === "string" ? materials : JSON.stringify(materials)) : null,
      },
    });

    // In-app announcement broadcast for enrolled students (instant in-app notification without external SMTP/egress)
    try {
      const track = await prisma.track.findUnique({
        where: { id: trackId },
        select: { name: true },
      });
      await prisma.announcement.create({
        data: {
          title: `New Lecture Scheduled: ${title.trim()} (${track?.name || "Track"})`,
          content: `A new lecture has been scheduled for ${date.trim()}${time ? ` at ${time.trim()}` : ""}${location ? ` in ${location.trim()}` : ""}. Check Session Hubs for materials and live check-in.`,
          category: "SCHEDULE",
          targetAudience: "ALL",
          trackId: trackId,
          authorName: "Academic Operations",
        },
      });
    } catch (annError) {
      console.warn("Auto announcement creation warning:", annError);
    }

    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error("POST /api/sessions error:", error);
    return NextResponse.json({ error: "Failed to add session." }, { status: 500 });
  }
}
