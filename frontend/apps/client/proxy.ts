import { NextResponse, type NextRequest } from "next/server";

// Gate on the refresh cookie, not the short-lived access cookie: an expired
// access token is renewed transparently by /api, so it must not bounce a user
// who is still signed in. Real validation always happens in the API.
export default function proxy(request: NextRequest) {
  if (!request.cookies.has("coifyn_refresh")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

// /api is excluded: the proxy there answers 401 itself, and redirecting an API
// call to an HTML login page would break every fetch.
export const config = {
  matcher: ["/((?!login|api|_next/static|_next/image|favicon.ico).*)"],
};
