import { getCurrentUser } from "./auth";
import { NextResponse } from "next/server";

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 }), user: null };
  }
  return { error: null, user };
}

export async function requireAdmin() {
  const { error, user } = await requireAuth();
  if (error || !user) return { error, user: null };

  if (user.role !== "ADMIN") {
    return {
      error: NextResponse.json({ error: "Access restricted to Main Administrator." }, { status: 403 }),
      user: null,
    };
  }
  return { error: null, user };
}

export async function requireAdminOrChair() {
  const { error, user } = await requireAuth();
  if (error || !user) return { error, user: null };

  if (!["ADMIN", "CHAIR_PERSON", "VICE_CHAIR"].includes(user.role)) {
    return {
      error: NextResponse.json({ error: "Access restricted to Executive Leadership." }, { status: 403 }),
      user: null,
    };
  }
  return { error: null, user };
}

export async function requireTrackAccess(trackId: string) {
  const { error, user } = await requireAuth();
  if (error || !user) return { error, user: null, canEdit: false };

  // Main Admin has full edit & attendance permissions across all tracks
  if (user.role === "ADMIN") {
    return { error: null, user, canEdit: true };
  }

  // Chair Person and Vice Chair can view everything (and can edit attendance/scores if authorized)
  if (["CHAIR_PERSON", "VICE_CHAIR"].includes(user.role)) {
    return { error: null, user, canEdit: true };
  }

  // Instructor belongs to this track
  if (user.role === "INSTRUCTOR") {
    if (user.assignedTrackId !== trackId) {
      return {
        error: NextResponse.json({ error: "Unauthorized: You can only access your assigned track." }, { status: 403 }),
        user: null,
        canEdit: false,
      };
    }
    return { error: null, user, canEdit: true };
  }

  // Student must be enrolled
  if (user.role === "STUDENT") {
    const isEnrolled = user.enrollments?.some((e) => e.trackId === trackId);
    if (!isEnrolled) {
      return {
        error: NextResponse.json({ error: "You are not enrolled in this track." }, { status: 403 }),
        user: null,
        canEdit: false,
      };
    }
    return { error: null, user, canEdit: false };
  }

  return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), user: null, canEdit: false };
}
