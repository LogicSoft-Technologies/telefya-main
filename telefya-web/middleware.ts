import { NextResponse, type NextRequest } from "next/server";

const platformPrefixes = [
  "/lobby",
  "/live",
  "/speaker",
  "/host",
  "/attendee",
  "/admin",
];

const authPrefixes = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPlatformRoute = platformPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  const isAuthRoute = authPrefixes.some((prefix) => pathname.startsWith(prefix));

  const cookieToken =
    request.cookies.get("telefya_access_token")?.value ||
    request.cookies.get("accessToken")?.value ||
    request.cookies.get("token")?.value;

  if (isPlatformRoute && !cookieToken) {
    // Current app stores token in localStorage, so the client guard remains
    // the real protection. This only protects future cookie-based sessions.
    return NextResponse.next();
  }

  if (isAuthRoute && cookieToken) {
    return NextResponse.redirect(new URL("/lobby", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/lobby/:path*",
    "/live/:path*",
    "/speaker/:path*",
    "/host/:path*",
    "/attendee/:path*",
    "/admin/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
  ],
};