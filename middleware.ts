import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const PARTNER_DOMAIN = "partner.pipzen.io";
const ADMIN_DOMAIN = "admin.pipzen.io";

function isAdminDomain(hostname: string) {
  return hostname === ADMIN_DOMAIN;
}

function isPartnerDomain(hostname: string) {
  return hostname === PARTNER_DOMAIN;
}

function isPartnerRoute(path: string) {
  return (
    path === "/" ||
    path === "/login" ||
    path.startsWith("/dashboard") ||
    path.startsWith("/network") ||
    path.startsWith("/earnings") ||
    path.startsWith("/withdrawals") ||
    path.startsWith("/campaigns") ||
    path.startsWith("/leaderboard") ||
    path.startsWith("/marketing") ||
    path.startsWith("/training") ||
    path.startsWith("/messages") ||
    path.startsWith("/notifications") ||
    path.startsWith("/settings") ||
    path.startsWith("/complete-profile") ||
    path.startsWith("/register")
  );
}

function isAdminRoute(path: string) {
  return path.startsWith("/admin");
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    // Behind Nginx proxy, req.nextUrl.hostname is 127.0.0.1 — use Host header instead
    const hostname = req.headers.get("host")?.split(":")[0] || req.nextUrl.hostname;

    // ============================================
    // ADMIN DOMAIN (admin.pipzen.io) — fully isolated
    // ============================================
    if (isAdminDomain(hostname)) {
      // Admin login + auth API are always accessible
      if (path === "/admin/login" || path.startsWith("/api/auth")) {
        // Redirect logged-in admins away from login page
        if (path === "/admin/login" && token && token.role === "ADMIN") {
          return NextResponse.redirect(new URL("/admin", req.url));
        }
        return NextResponse.next();
      }

      // Root "/" → admin dashboard or admin login
      if (path === "/") {
        if (token && token.role === "ADMIN") {
          return NextResponse.redirect(new URL("/admin", req.url));
        }
        return NextResponse.redirect(new URL("/admin/login", req.url));
      }

      // Block ALL partner routes on admin domain
      if (isPartnerRoute(path)) {
        if (token && token.role === "ADMIN") {
          return NextResponse.redirect(new URL("/admin", req.url));
        }
        return NextResponse.redirect(new URL("/admin/login", req.url));
      }

      // Everything else on admin domain requires ADMIN auth
      if (!token) {
        return NextResponse.redirect(new URL("/admin/login", req.url));
      }
      if (token.role !== "ADMIN") {
        // Partner user on admin domain — redirect to partner domain
        return NextResponse.redirect(new URL("https://partner.pipzen.io"));
      }
      if (token.status === "BANNED") {
        return NextResponse.redirect(new URL("/admin/login?error=banned", req.url));
      }

      return NextResponse.next();
    }

    // ============================================
    // PARTNER DOMAIN (partner.pipzen.io) — fully isolated
    // ============================================
    if (isPartnerDomain(hostname)) {
      // Admin user on partner domain — immediately redirect to admin domain
      if (token && token.role === "ADMIN" && !path.startsWith("/api/auth")) {
        return NextResponse.redirect(new URL("https://admin.pipzen.io"));
      }

      // Public routes: landing, login, register, auth API
      if (
        path === "/" ||
        path.startsWith("/login") ||
        path.startsWith("/register") ||
        path.startsWith("/api/auth")
      ) {
        // Redirect logged-in partners away from login
        if (path === "/login" && token && token.role === "PARTNER") {
          return NextResponse.redirect(new URL("/dashboard", req.url));
        }
        return NextResponse.next();
      }

      // Block ALL admin routes on partner domain
      if (isAdminRoute(path)) {
        if (token) {
          return NextResponse.redirect(new URL("/dashboard", req.url));
        }
        return NextResponse.redirect(new URL("/login", req.url));
      }

      // Everything else on partner domain requires authentication
      if (!token) {
        return NextResponse.redirect(new URL("/login", req.url));
      }

      // Banned users
      if (token.status === "BANNED") {
        return NextResponse.redirect(new URL("/login?error=banned", req.url));
      }

      // Profile not completed — force to /complete-profile
      if (
        token.role === "PARTNER" &&
        !token.profileCompleted &&
        path !== "/complete-profile" &&
        !path.startsWith("/api")
      ) {
        return NextResponse.redirect(new URL("/complete-profile", req.url));
      }

      return NextResponse.next();
    }

    // ============================================
    // LOCALHOST — allow everything for development
    // ============================================

    // Public paths on localhost
    if (
      path === "/" ||
      path.startsWith("/login") ||
      path.startsWith("/register") ||
      path === "/admin/login" ||
      path.startsWith("/api/auth")
    ) {
      // Redirect logged-in partners away from partner login
      if (path === "/login" && token && token.role === "PARTNER") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      // Redirect logged-in admins away from login pages
      if ((path === "/admin/login" || path === "/login") && token && token.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return NextResponse.next();
    }

    // Protected paths on localhost require auth
    if (!token) {
      return NextResponse.next();
    }

    // Banned users
    if (token.status === "BANNED" && path !== "/login" && path !== "/admin/login") {
      return NextResponse.redirect(new URL("/login?error=banned", req.url));
    }

    // Profile not completed — force to /complete-profile
    if (
      token.role === "PARTNER" &&
      !token.profileCompleted &&
      path !== "/complete-profile" &&
      !path.startsWith("/api")
    ) {
      return NextResponse.redirect(new URL("/complete-profile", req.url));
    }

    // Admin routes (except admin login) — require ADMIN role
    if (path.startsWith("/admin") && path !== "/admin/login" && token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Redirect admins to admin dashboard when accessing partner-only routes
    if (
      token.role === "ADMIN" &&
      !path.startsWith("/admin") &&
      !path.startsWith("/api") &&
      path !== "/" &&
      !path.startsWith("/login") &&
      !path.startsWith("/register")
    ) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Always return true — all routing logic is handled in the middleware function above.
      // This prevents NextAuth from redirecting to NEXTAUTH_URL/login (which would
      // cross subdomains and break admin.pipzen.io).
      authorized: () => true,
    },
  }
);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.svg|placeholder-avatar.png).*)",
  ],
};
