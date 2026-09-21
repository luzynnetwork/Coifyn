import { NextRequest, NextResponse } from "next/server";
import { backendUrl } from "./backend-url";
import { requestHeaders, responseHeaders } from "./proxy-headers";
import { refreshTokens } from "./refresh-tokens";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  applySessionCookies,
  clearSessionCookies,
  type SessionTokens,
} from "./session-cookies";

/**
 * Forwards a browser call to the API with the bearer token taken from the
 * httpOnly cookie. If the API answers 401 and a refresh token exists, it
 * rotates the pair once, retries, and sets the new cookies on the way back; if
 * the refresh fails the cookies are cleared so the gate sends the user to login.
 * The body is streamed straight through, which is what keeps SSE working.
 */
export async function forwardToBackend(
  req: NextRequest,
  path: string[],
): Promise<NextResponse> {
  const target = `${backendUrl()}/api/${path.join("/")}${req.nextUrl.search}`;
  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const body = hasBody ? await req.arrayBuffer() : undefined;

  const send = (accessToken?: string) =>
    fetch(target, {
      method: req.method,
      headers: requestHeaders(req, accessToken),
      body,
      redirect: "manual",
      cache: "no-store",
      signal: req.signal,
    });

  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
  let upstream = await send(req.cookies.get(ACCESS_COOKIE)?.value);

  let rotated: SessionTokens | null = null;
  let refreshFailed = false;
  if (upstream.status === 401 && refreshToken) {
    rotated = await refreshTokens(refreshToken);
    if (rotated) upstream = await send(rotated.accessToken);
    else refreshFailed = true;
  }

  const empty = upstream.status === 204 || upstream.status === 304;
  const res = new NextResponse(empty ? null : upstream.body, {
    status: upstream.status,
    headers: responseHeaders(upstream.headers),
  });

  if (rotated) applySessionCookies(res, rotated);
  if (refreshFailed) clearSessionCookies(res);
  return res;
}
