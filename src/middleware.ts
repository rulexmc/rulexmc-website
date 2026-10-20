import { NextResponse, type NextRequest } from "next/server";

/**
 * Fast-path redirect for signed-out visitors to protected areas (gives a real 307
 * instead of a streamed client redirect). This is NOT the security boundary:
 * every protected page and server action re-checks the session and role server-side.
 */
export function middleware(req: NextRequest) {
  if (!req.cookies.get("rx_session")?.value) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(req.nextUrl.pathname)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/portal/:path*", "/admin/:path*"] };
