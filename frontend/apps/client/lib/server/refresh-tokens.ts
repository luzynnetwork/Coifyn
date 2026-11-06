import { backendUrl } from "./backend-url";
import type { SessionTokens } from "./session-cookies";

/** Exchanges a refresh token for a rotated pair, or null if it is no longer valid. */
export async function refreshTokens(
  refreshToken: string,
): Promise<SessionTokens | null> {
  const response = await fetch(`${backendUrl()}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });
  if (!response.ok) return null;

  const data = (await response.json()) as Partial<SessionTokens>;
  if (!data.accessToken || !data.refreshToken) return null;
  return { accessToken: data.accessToken, refreshToken: data.refreshToken };
}
