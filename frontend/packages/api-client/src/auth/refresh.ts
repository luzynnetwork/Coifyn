import { baseFetch } from "../http/base-fetch";
import type { AuthTokens, RefreshInput } from "./types";

/** POST /auth/refresh — rotates the refresh token and issues a new pair. */
export function refresh(input: RefreshInput): Promise<AuthTokens> {
  return baseFetch<AuthTokens>("/auth/refresh", {
    method: "POST",
    body: input,
    authenticated: false,
  });
}
