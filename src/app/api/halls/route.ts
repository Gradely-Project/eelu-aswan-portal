import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const day = searchParams.get("day");
    const status = searchParams.get("status");

    const where: any = {};
    if (day && day !== "ALL") where.dayOfWeek = day;
    if (status && status !== "ALL") where.status = status;

    const slots = await prisma.hallSlot.findMany({
      where,
      orderBy: [
        { dayOfWeek: "asc" },
        { timeSlot: "asc" },
      ],
    });

    return NextResponse.json({ slots });
  } catch (error) {
    console.error("GET /api/halls error:", error);
    return NextResponse.json({ error: "Failed to fetch hall slots." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { error, user } = await requireAuth();
    if (error || !user) return error;

    // Only Admin, Chairperson, and Vice Chair can add available halls
    const canManageHalls = ["ADMIN", "CHAIR_PERSON", "VICE_CHAIR"].includes(user.role);
    if (!canManageHalls) {
      return NextResponse.json(
        { error: "Unauthorized. Branch Administration & Chairperson only." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { hallName, dayOfWeek, date, timeSlot, capacity, notes } = body;

    if (!hallName || !dayOfWeek || !timeSlot) {
      return NextResponse.json(
        { error: "Hall name, Day of week, and Time slot are required." },
        { status: 400 }
      );
    }

    const newSlot = await prisma.hallSlot.create({
      data: {
        hallName: hallName.trim(),
        dayOfWeek: dayOfWeek.trim(),
        date: date ? date.trim() : null,
        timeSlot: timeSlot.trim(),
        capacity: capacity ? parseInt(capacity, 10) : 50,
        notes: notes ? notes.trim() : null,
        status: "AVAILABLE",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Available hall slot registered successfully.",
      slot: newSlot,
    });
  } catch (error) {
    console.error("POST /api/halls error:", error);
    return NextResponse.json({ error: "Failed to add hall slot." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { error, user } = await requireAuth();
    if (error || !user) return error;

    const body = await req.json();
    const { slotId, action, trackId, trackName, broadcastAnnouncement } = body;

    if (!slotId || !action) {
      return NextResponse.json({ error: "Slot ID and Action are required." }, { status: 400 });
    }

    const existingSlot = await prisma.hallSlot.findUnique({
      where: { id: slotId },
    });

    if (!existingSlot) {
      return NextResponse.json({ error: "Hall slot not found." }, { status: 404 });
    }

    if (action === "BOOK") {
      // Must be INSTRUCTOR (Head/Vice/Core) or ADMIN
      if (!["INSTRUCTOR", "ADMIN", "CHAIR_PERSON"].includes(user.role)) {
        return NextResponse.json({ error: "Unauthorized to book halls." }, { status: 403 });
      }

      let finalTrackId = trackId;
      let finalTrackName = trackName;

      if (user.role === "INSTRUCTOR") {
        if (!user.assignedTrackId) {
          return NextResponse.json({ error: "You are not assigned to a track." }, { status: 400 });
        }
        finalTrackId = user.assignedTrackId;
        const track = await prisma.track.findUnique({ where: { id: user.assignedTrackId } });
        finalTrackName = track?.name || "Assigned Track";
      }

      if (existingSlot.status === "BOOKED") {
        return NextResponse.json(
          { error: `This hall slot is already booked by ${existingSlot.bookedTrackName || "another track"}.` },
          { status: 400 }
        );
      }

      const updated = await prisma.hallSlot.update({
        where: { id: slotId },
        data: {
          status: "BOOKED",
          bookedTrackId: finalTrackId,
          bookedTrackName: finalTrackName,
          bookedById: user.id,
          bookedByName: user.name,
          bookedAt: new Date(),
        },
      });

      // If broadcast requested, automatically create an announcement for track students!
      if (broadcastAnnouncement && finalTrackId) {
        await prisma.announcement.create({
          data: {
            title: `📍 Lecture Venue Booked: ${updated.hallName}`,
            content: `Next lecture for ${finalTrackName} is scheduled on ${updated.dayOfWeek} at ${updated.timeSlot} in ${updated.hallName}. Please arrive 10 minutes early.`,
            category: "SCHEDULE",
            trackId: finalTrackId,
            authorName: `${user.name} (${finalTrackName} Team)`,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: `Hall "${updated.hallName}" successfully reserved for ${finalTrackName}!`,
        slot: updated,
      });
    } else if (action === "RELEASE") {
      // Can only release if ADMIN or the user/track that booked it
      const canRelease =
        user.role === "ADMIN" ||
        user.role === "CHAIR_PERSON" ||
        existingSlot.bookedById === user.id ||
        (user.role === "INSTRUCTOR" && existingSlot.bookedTrackId === user.assignedTrackId);

      if (!canRelease) {
        return NextResponse.json({ error: "Unauthorized to cancel this booking." }, { status: 403 });
      }

      const updated = await prisma.hallSlot.update({
        where: { id: slotId },
        data: {
          status: "AVAILABLE",
          bookedTrackId: null,
          bookedTrackName: null,
          bookedById: null,
          bookedByName: null,
          bookedAt: null,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Hall "${updated.hallName}" reservation has been released.`,
        slot: updated,
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    console.error("PATCH /api/halls error:", error);
    return NextResponse.json({ error: "Failed to update booking." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { error, user } = await requireAuth();
    if (error || !user) return error;

    if (!["ADMIN", "CHAIR_PERSON"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized. Admin only." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID is required." }, { status: 400 });

    await prisma.hallSlot.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Hall slot deleted." });
  } catch (error) {
    console.error("DELETE /api/halls error:", error);
    return NextResponse.json({ error: "Failed to delete slot." }, { status: 500 });
  }
}
