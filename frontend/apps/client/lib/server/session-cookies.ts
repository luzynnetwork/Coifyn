import type { NextResponse } from "next/server";

export const ACCESS_COOKIE = "coifyn_access";
export const REFRESH_COOKIE = "coifyn_refresh";

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

const THIRTY_DAYS = 60 * 60 * 24 * 30;

/**
 * Tokens live only in httpOnly cookies, so page JavaScript (and any script an
 * attacker manages to inject) can never read them. The browser talks to this
 * app's own /api, which adds the bearer header server-side.
 */
function options() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: THIRTY_DAYS,
  };
}

export function applySessionCookies(
  res: NextResponse,
  tokens: SessionTokens,
): void {
  res.cookies.set(ACCESS_COOKIE, tokens.accessToken, options());
  res.cookies.set(REFRESH_COOKIE, tokens.refreshToken, options());
}

export function clearSessionCookies(res: NextResponse): void {
  res.cookies.set(ACCESS_COOKIE, "", { ...options(), maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, "", { ...options(), maxAge: 0 });
}
