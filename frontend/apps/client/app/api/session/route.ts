import { NextResponse, type NextRequest } from "next/server";
import { backendUrl } from "../../../lib/server/backend-url";
import {
  REFRESH_COOKIE,
  applySessionCookies,
  clearSessionCookies,
  type SessionTokens,
} from "../../../lib/server/session-cookies";

export const dynamic = "force-dynamic";

/** Sign in: exchange credentials for tokens and keep them in httpOnly cookies. */
export async function POST(req: NextRequest) {
  const credentials = await req.text();
  const upstream = await fetch(`${backendUrl()}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: credentials,
    cache: "no-store",
  });

  if (!upstream.ok) {
    // Pass the API's own status through, but never its body: a login failure
    // must not reveal whether the account exists.
    const status = upstream.status === 400 ? 400 : 401;
    return NextResponse.json({ error: "invalid_credentials" }, { status });
  }

  const tokens = (await upstream.json()) as SessionTokens;
  const res = NextResponse.json({ ok: true });
  applySessionCookies(res, tokens);
  return res;
}

/** Sign out: revoke the refresh token server-side, then clear the cookies. */
export async function DELETE(req: NextRequest) {
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
  if (refreshToken) {
    await fetch(`${backendUrl()}/api/v1/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    }).catch(() => undefined);
  }

  const res = new NextResponse(null, { status: 204 });
  clearSessionCookies(res);
  return res;
}
