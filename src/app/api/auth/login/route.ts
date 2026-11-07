import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signJwtToken, COOKIE_NAME } from "@/lib/auth";

// In-memory sliding-window anti-brute-force tracker
interface RateLimitRecord {
  attempts: number;
  blockedUntil: number;
  lastAttempt: number;
}
const loginAttemptsMap = new Map<string, RateLimitRecord>();

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

function cleanExpiredRecords() {
  const now = Date.now();
  loginAttemptsMap.forEach((record, key) => {
    if (now - record.lastAttempt > 10 * 60 * 1000) {
      loginAttemptsMap.delete(key);
    }
  });
}

export async function POST(req: Request) {
  try {
    cleanExpiredRecords();

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Please enter your email and password." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const clientIp = getClientIp(req);
    const rateLimitKey = `${clientIp}_${normalizedEmail}`;

    // Check if currently blocked
    const now = Date.now();
    const existingRecord = loginAttemptsMap.get(rateLimitKey);
    if (existingRecord && existingRecord.blockedUntil > now) {
      const waitSeconds = Math.ceil((existingRecord.blockedUntil - now) / 1000);
      return NextResponse.json(
        {
          error: `تم تجاوز الحد الأقصى للمحاولات الخاطئة. لحماية الحساب، يرجى الانتظار ${waitSeconds} ثانية والمحاولة مجدداً.`,
          retryAfter: waitSeconds,
        },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        assignedTrack: true,
      },
    });

    const isMatch = user ? await bcrypt.compare(password, user.password) : false;

    if (!user || !isMatch) {
      // Record failed attempt
      const attempts = (existingRecord?.attempts || 0) + 1;
      const blockedUntil = attempts >= 5 ? now + 60 * 1000 : 0; // 60s cooldown after 5 failed attempts
      loginAttemptsMap.set(rateLimitKey, {
        attempts,
        blockedUntil,
        lastAttempt: now,
      });

      if (attempts >= 5) {
        return NextResponse.json(
          {
            error: "تم حظر المحاولات مؤقتاً بسبب تكرار كلمة المرور الخاطئة 5 مرات. يرجى الانتظار دقيقة كاملة.",
            retryAfter: 60,
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: "Invalid credentials. Please verify your email and password." },
        { status: 401 }
      );
    }

    // Reset rate limit record on successful authentication
    loginAttemptsMap.delete(rateLimitKey);

    // Check approval & suspension status
    if (user.status === "PENDING") {
      return NextResponse.json(
        {
          error:
            "Your registration is pending approval by the Main Administrator. Access will be unlocked once approved.",
          status: "PENDING",
        },
        { status: 403 }
      );
    }

    if (user.status === "SUSPENDED") {
      return NextResponse.json(
        {
          error:
            "Your student account has been temporarily suspended by the branch administration. Please contact your coordinator.",
          status: "SUSPENDED",
        },
        { status: 403 }
      );
    }

    if (user.status === "REJECTED") {
      return NextResponse.json(
        {
          error: "Your admission application was rejected. Please contact administration.",
          status: "REJECTED",
        },
        { status: 403 }
      );
    }

    // Safely update last login timestamp without blocking successful auth
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    } catch (updateErr) {
      console.warn("Failed to update lastLoginAt (non-blocking):", updateErr);
    }

    // Create session token
    const token = signJwtToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      trackTeamRole: user.trackTeamRole,
      assignedTrackId: user.assignedTrackId,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        trackTeamRole: user.trackTeamRole,
        assignedTrackId: user.assignedTrackId,
        assignedTrackName: user.assignedTrack?.name,
        lastLoginAt: new Date().toISOString(),
      },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}
