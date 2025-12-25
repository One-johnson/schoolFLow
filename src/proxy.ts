import { NextResponse, NextRequest } from "next/server";

export default async function proxy(request: NextRequest) {
  const isApiRoute = request.nextUrl.pathname.startsWith("/api/");
  const url = new URL("/api/logger", request.url);
  const requestId = crypto.randomUUID();

  // Tenant Detection (Multi-tenancy support)
  const hostname = request.headers.get("host") || "";
  const subdomain = hostname.split(".")[0];

  // Store tenant info in headers for server-side access
  const response = NextResponse.next();
  
  if (subdomain && subdomain !== "localhost" && subdomain !== "www") {
    response.headers.set("x-tenant-subdomain", subdomain);
  }

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

  return response;
}

export const config = {
  matcher: ["/((?!_next/image|_next/static|api/logger|favicon.ico).*)"],
};
