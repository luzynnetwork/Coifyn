import { NextResponse, type NextRequest } from "next/server";

// Phase 0 placeholder: gates on session cookie presence only. Real token
// validation (expiry, signature) stays server-side via the API.
export default function proxy(request: NextRequest) {
  const hasSession = request.cookies.has("coifyn_session");
  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico).*)"],
};
