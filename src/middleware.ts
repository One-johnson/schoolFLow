import { NextRequest, NextResponse } from "next/server";

const TEACHER_SESSION_COOKIE_NAME = "schoolflow_teacher_session";
const PARENT_SESSION_COOKIE_NAME = "schoolflow_parent_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Teacher portal route protection
  if (pathname.startsWith("/teacher")) {
    const hasTeacherSession = request.cookies.has(TEACHER_SESSION_COOKIE_NAME);

    // Protected teacher routes (everything except /teacher/login)
    if (pathname !== "/teacher/login") {
      if (!hasTeacherSession) {
        return NextResponse.redirect(new URL("/teacher/login", request.url));
      }
    }

    // If on login page and already has session, redirect to dashboard
    if (pathname === "/teacher/login" && hasTeacherSession) {
      return NextResponse.redirect(new URL("/teacher", request.url));
    }
  }

  // Parent portal route protection
  if (pathname.startsWith("/parent")) {
    const hasParentSession = request.cookies.has(PARENT_SESSION_COOKIE_NAME);
    const isPublicRoute = pathname === "/parent/login" || pathname === "/parent/register";

    if (!isPublicRoute && !hasParentSession) {
      return NextResponse.redirect(new URL("/parent/login", request.url));
    }

    if (isPublicRoute && hasParentSession) {
      return NextResponse.redirect(new URL("/parent", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/teacher/:path*", "/parent/:path*"],
};
