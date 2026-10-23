import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const instructors = await prisma.user.findMany({
      where: {
        role: "INSTRUCTOR",
      },
      include: {
        assignedTrack: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ instructors });
  } catch (error) {
    console.error("GET /api/admin/assign-team error:", error);
    return NextResponse.json({ error: "Failed to fetch instructors directory." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await req.json();
    const { name, email, password, trackId, trackTeamRole, removeUserId } = body;

    // Handle removal of instructor
    if (removeUserId) {
      await prisma.user.update({
        where: { id: removeUserId },
        data: {
          assignedTrackId: null,
          trackTeamRole: null,
          role: "STUDENT",
        },
      });
      return NextResponse.json({ success: true, message: "Member removed from track leadership team successfully." });
    }

    if (!name || !email || !trackId || !trackTeamRole) {
      return NextResponse.json(
        { error: "Please provide all required fields (Name, Email, Track, and Team Role)." },
        { status: 400 }
      );
    }

    const validRoles = ["HEAD", "VICE_HEAD", "CORE_TEAM"];
    if (!validRoles.includes(trackTeamRole)) {
      return NextResponse.json(
        { error: "Invalid role selected. Valid roles: Head, Vice Head, Core Team." },
        { status: 400 }
      );
    }

    // Check track existence
    const track = await prisma.track.findUnique({ where: { id: trackId } });
    if (!track) {
      return NextResponse.json({ error: "The selected track does not exist." }, { status: 404 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      // Update existing user into instructor
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: name.trim(),
          role: "INSTRUCTOR",
          trackTeamRole,
          assignedTrackId: trackId,
          status: "APPROVED",
        },
        include: { assignedTrack: true },
      });

      return NextResponse.json({
        success: true,
        message: `Assigned ${updated.name} as ${trackTeamRole} in ${track.name} successfully.`,
        user: updated,
      });
    } else {
      // Create new instructor user
      if (!password || password.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters long." },
          { status: 400 }
        );
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await prisma.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          password: hashedPassword,
          role: "INSTRUCTOR",
          trackTeamRole,
          assignedTrackId: trackId,
          status: "APPROVED",
        },
        include: { assignedTrack: true },
      });

      return NextResponse.json({
        success: true,
        message: `Account created for ${newUser.name} and assigned as ${trackTeamRole} in ${track.name}.`,
        user: newUser,
      });
    }
  } catch (error) {
    console.error("POST /api/admin/assign-team error:", error);
    return NextResponse.json({ error: "Failed to assign track team member." }, { status: 500 });
  }
}
