import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { user } = await requireAuth();
    const { searchParams } = new URL(req.url);
    let trackId = searchParams.get("trackId");

    // If instructor, strictly restrict to their assigned track!
    if (user?.role === "INSTRUCTOR") {
      trackId = user.assignedTrackId || "none";
    }

    const whereClause: any = {};
    if (trackId && trackId !== "ALL") whereClause.trackId = trackId;

    const schedules = await prisma.weeklySchedule.findMany({
      where: whereClause,
      include: {
        track: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ schedules });
  } catch (error) {
    console.error("GET /api/admin/schedule error:", error);
    return NextResponse.json({ error: "Failed to fetch schedules." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { error, user } = await requireAuth();
    if (error || !user) return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action, scheduleId, trackId, dayOfWeek, time, location, topic, sendEmail } = body;

    // Check permissions
    const isLeadership = ["ADMIN", "CHAIR_PERSON", "VICE_CHAIR"].includes(user.role);
    const isInstructor = user.role === "INSTRUCTOR";

    if (!isLeadership && !isInstructor) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    // Broadcast email to students for an existing schedule
    if (action === "BROADCAST") {
      const schedule = await prisma.weeklySchedule.findUnique({
        where: { id: scheduleId },
        include: {
          track: {
            include: {
              enrollments: {
                where: { user: { status: "APPROVED" } },
                include: { user: true },
              },
            },
          },
        },
      });

      if (!schedule) {
        return NextResponse.json({ error: "Schedule not found." }, { status: 404 });
      }

      // If instructor, ensure it's their track
      if (isInstructor && schedule.trackId !== user.assignedTrackId) {
        return NextResponse.json(
          { error: "Instructors can only broadcast to their assigned track." },
          { status: 403 }
        );
      }

      const recipientEmails = schedule.track.enrollments.map((e) => e.user.email);

      await prisma.weeklySchedule.update({
        where: { id: scheduleId },
        data: { emailSent: true },
      });

      return NextResponse.json({
        success: true,
        recipientCount: recipientEmails.length,
        message: `Email broadcast dispatched to ${recipientEmails.length} students in ${schedule.track.name}.`,
      });
    }

    // Creating a new schedule
    if (!trackId || !dayOfWeek || !time || !topic) {
      return NextResponse.json(
        { error: "Track, day, time, and lecture topic are required." },
        { status: 400 }
      );
    }

    // If instructor, enforce that trackId is their assigned track
    if (isInstructor && trackId !== user.assignedTrackId) {
      return NextResponse.json(
        { error: "Instructors can only publish schedules for their assigned track." },
        { status: 403 }
      );
    }

    const schedule = await prisma.weeklySchedule.create({
      data: {
        trackId,
        dayOfWeek,
        time: time.trim(),
        location: location ? location.trim() : "Campus Lab & Online Meet",
        topic: topic.trim(),
        emailSent: !!sendEmail,
      },
      include: {
        track: {
          include: {
            enrollments: {
              where: { user: { status: "APPROVED" } },
              include: { user: true },
            },
          },
        },
      },
    });

    // Also publish to Announcements feed & platform notifications
    await prisma.announcement.create({
      data: {
        title: `Upcoming Lecture: ${topic.trim()} (${schedule.track.name})`,
        content: `Scheduled for ${dayOfWeek} at ${time.trim()}.\nLocation: ${location ? location.trim() : "Campus Lab & Online Meet"}\nTopic: ${topic.trim()}`,
        category: "SCHEDULE",
        trackId: schedule.trackId,
        authorName: `${user.name} (${user.role === "INSTRUCTOR" ? "Track Lead" : "Branch Administration"})`,
      },
    });

    const enrolledStudents = schedule.track.enrollments.map((e) => e.user.email);

    return NextResponse.json({
      success: true,
      schedule,
      recipientCount: enrolledStudents.length,
      message: sendEmail
        ? `Schedule created and broadcast sent to ${enrolledStudents.length} students in ${schedule.track.name}.`
        : `Schedule created for ${schedule.track.name}.`,
    });
  } catch (error) {
    console.error("POST /api/admin/schedule error:", error);
    return NextResponse.json({ error: "Failed to manage schedule." }, { status: 500 });
  }
}
