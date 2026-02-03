import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decryptSessionEdge } from "@/lib/auth/session.edge";

const PUBLIC_PATHS = ["/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("session")?.value;

  // Check if user has a valid session
  const session = sessionCookie
    ? await decryptSessionEdge(sessionCookie)
    : null;
  const isAuthenticated = session !== null;

  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  // Redirect authenticated users away from login/signup
  if (isAuthenticated && isPublicPath) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
