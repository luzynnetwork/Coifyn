import { NextResponse, type NextRequest } from "next/server";

// Phase 0 placeholder: gates on session cookie presence only. Real token
// validation (expiry, signature) stays server-side via the API.
//
// Phase 2: the salon page (/s/…), the booking request, the public wait board
// (/queue/…) and the /api proxy for them need no account — a visitor can look
// and request a slot with just a name and phone.
export default function proxy(request: NextRequest) {
  const hasSession = request.cookies.has("coifyn_customer_session");
  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!login|s/|queue/|api/|_next/static|_next/image|favicon.ico).*)"],
};
