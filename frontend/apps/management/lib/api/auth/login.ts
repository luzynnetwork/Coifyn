import { staffLogin, type AuthTokens, type LoginInput } from "@coifyn/api-client";

/** Thin wrapper around the shared staff login call. */
export function login(input: LoginInput): Promise<AuthTokens> {
  return staffLogin(input);
}
