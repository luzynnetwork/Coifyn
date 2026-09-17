import { baseFetch } from "../http/base-fetch";
import type { AuthTokens, LoginInput } from "./types";

/** POST /auth/login */
export function login(input: LoginInput): Promise<AuthTokens> {
  return baseFetch<AuthTokens>("/auth/login", {
    method: "POST",
    body: input,
    authenticated: false,
  });
}
