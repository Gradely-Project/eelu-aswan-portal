import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get("branch_session")?.value;
  const { pathname } = request.nextUrl;

  const protectedRoutes = [
    "/dashboard",
    "/admin",
    "/attendance",
    "/sessions",
    "/tasks",
    "/schedules",
    "/report",
    "/halls",
    "/certificates",
    "/analytics",
    "/leaderboard",
  ];

  const isProtected = protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (isProtected && !sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If already authenticated and visiting /login or /register, redirect to /dashboard
  if (sessionToken && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/dashboard",
    "/admin/:path*",
    "/attendance/:path*",
    "/sessions/:path*",
    "/tasks/:path*",
    "/schedules/:path*",
    "/report/:path*",
    "/halls/:path*",
    "/certificates/:path*",
    "/analytics/:path*",
    "/analytics",
    "/leaderboard/:path*",
    "/leaderboard",
    "/login",
    "/register",
  ],
};
