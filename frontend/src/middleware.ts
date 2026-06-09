import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple base64 decoding helper for JWT payload (runs on Next.js Edge)
function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("vendorapos_token")?.value;

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isDashboardPage = pathname.startsWith("/dashboard");

  // 1. If trying to access dashboard but not logged in -> redirect to login
  if (isDashboardPage && !token) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }

  // 2. If logged in and trying to access auth pages -> redirect to dashboard
  if (isAuthPage && token) {
    const url = new URL("/dashboard", request.url);
    return NextResponse.redirect(url);
  }

  // 3. Strict Role-based Sub-route protection
  if (isDashboardPage && token) {
    const payload = parseJwt(token);
    if (!payload || !payload.role) {
      // Invalid token payload -> force logout / login redirect
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("vendorapos_token");
      return response;
    }

    const role = typeof payload.role === "string" ? payload.role : payload.role[0];

    // Enforce dashboard sub-route checks
    if (pathname.startsWith("/dashboard/super-admin") && role !== "SuperAdmin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (pathname.startsWith("/dashboard/owner") && role !== "Owner") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (pathname.startsWith("/dashboard/manager") && role !== "Manager") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (pathname.startsWith("/dashboard/cashier") && role !== "Cashier") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Role-based redirect if hitting the base /dashboard route exactly
    if (pathname === "/dashboard" || pathname === "/dashboard/") {
      if (role === "SuperAdmin") {
        return NextResponse.redirect(new URL("/dashboard/super-admin", request.url));
      } else if (role === "Owner") {
        return NextResponse.redirect(new URL("/dashboard/owner", request.url));
      } else if (role === "Manager") {
        return NextResponse.redirect(new URL("/dashboard/manager", request.url));
      } else if (role === "Cashier") {
        return NextResponse.redirect(new URL("/dashboard/cashier", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register", "/dashboard"],
};

