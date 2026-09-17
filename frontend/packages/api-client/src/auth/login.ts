import { baseFetch } from "../http/base-fetch.js";
import type { AuthTokens, LoginInput } from "./types.js";

/** POST /auth/login */
export function login(input: LoginInput): Promise<AuthTokens> {
  return baseFetch<AuthTokens>("/auth/login", {
    method: "POST",
    body: input,
    authenticated: false,
  });
}
