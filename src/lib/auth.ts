import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "branch-secret-key-super-safe-2026";
export const COOKIE_NAME = "branch_session";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  trackTeamRole?: string | null;
  assignedTrackId?: string | null;
}

export function signJwtToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyJwtToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const decoded = verifyJwtToken(token);
    if (!decoded || !decoded.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        assignedTrack: true,
        enrollments: {
          include: {
            track: true,
          },
        },
      },
    });

    if (!user || user.status !== "APPROVED") return null;

    return user;
  } catch (error) {
    console.error("getCurrentUser error:", error);
    return null;
  }
}
