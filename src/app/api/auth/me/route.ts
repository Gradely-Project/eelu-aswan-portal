import { NextResponse } from "next/server";
import { getCurrentUser, verifyJwtToken, COOKIE_NAME } from "@/lib/auth";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (token) {
      const decoded = verifyJwtToken(token);
      if (decoded?.userId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { status: true },
        });

        if (dbUser?.status === "SUSPENDED") {
          const resp = NextResponse.json(
            {
              user: null,
              isSuspended: true,
              error: "تم تجميد حسابك بواسطة إدارة الفرع.",
            },
            { status: 403 }
          );
          resp.cookies.delete(COOKIE_NAME);
          return resp;
        }
      }
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        college: user.college,
        academicYear: user.academicYear,
        role: user.role,
        trackTeamRole: user.trackTeamRole,
        assignedTrackId: user.assignedTrackId,
        assignedTrack: user.assignedTrack,
        enrollments: user.enrollments,
      },
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
