import { NextResponse, NextRequest } from "next/server";
import { SessionManager } from "@/lib/session";

export default async function middleware(request: NextRequest) {
  const isApiRoute = request.nextUrl.pathname.startsWith("/api/");
  const url = new URL("/api/logger", request.url);
  const requestId = crypto.randomUUID();

  // Log request (non-blocking)
  try {
    await fetch(url.toString(), {
      method: "POST",
      body: JSON.stringify({
        level: "info",
        requestId,
        request: {
          url: request.url,
          method: request.method,
          path: request.nextUrl.pathname,
          referrerPolicy: request.referrerPolicy,
          headers: Object.fromEntries(request.headers.entries()),
          cookies: request.cookies.getAll().reduce((acc, cookie) => {
            acc[cookie.name] = cookie.value;
            return acc;
          }, {} as Record<string, string>),
        },
      }),
    });
  } catch (error) {
    console.error("Error logging request:", error);
  }

  const response = NextResponse.next();
  response.headers.set("x-request-id", requestId);

  if (!isApiRoute) {
    response.cookies.set("x-request-id", requestId, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60,
      secure: request.url.startsWith("https"),
    });
  }

  // Authentication and route protection
  const pathname = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/about',
    '/contact',
    '/features',
  ];

  // Check if it's a public route or API route (handled separately)
  if (publicRoutes.includes(pathname) || isApiRoute) {
    return response;
  }

  // Protected routes - require authentication
  const session = await SessionManager.getSession();

  // No session - redirect to login
  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Super Admin routes protection
  if (pathname.startsWith('/super-admin')) {
    if (session.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // School Admin routes protection
  if (pathname.startsWith('/school-admin')) {
    if (session.role !== 'school_admin') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/image|_next/static|api/logger|favicon.ico|fonts|.*\\.woff|.*\\.woff2).*)"],
};
