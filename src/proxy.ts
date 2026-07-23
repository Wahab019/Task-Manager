import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Appwrite session cookie name: a_session_<projectId>
// NOTE: On localhost without a custom domain, Appwrite falls back to
// localStorage — so this cookie may not be present. In that case we let
// the client-side AuthContext handle the redirect from the root page.
// Server-side (Next.js 16 convention): redirects / → /dashboard if Appwrite cookie is present (works on Vercel with custom domain)

const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "";
const SESSION_COOKIE = `a_session_${PROJECT_ID}`;

const PUBLIC_PATHS = ["/login", "/reset-password"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionCookie = request.cookies.get(SESSION_COOKIE);
  const isLoggedIn = Boolean(sessionCookie?.value);

  // Root path: redirect based on cookie session.
  // If Appwrite stored the session in localStorage (localhost without custom
  // domain), isLoggedIn will be false — root page.tsx handles that case
  // client-side via AuthContext.
  if (pathname === "/") {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    // Let page.tsx render so the client-side check can run
    return NextResponse.next();
  }

  // If logged in (cookie) and on a public/auth page, send to dashboard
  if (isLoggedIn && PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  /*
   * Match all request paths except:
   * - _next/static (static files)
   * - _next/image (image optimization)
   * - favicon.ico, sitemap.xml, robots.txt
   * - api routes
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/).*)",
  ],
};
