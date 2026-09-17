import { baseFetch } from "../http/base-fetch.js";
import type { ForgotPasswordInput } from "./types.js";

// ASSUMPTION: POST /portal/auth/forgot-password — route not confirmed yet, see types.ts.
export function forgotPassword(input: ForgotPasswordInput): Promise<void> {
  return baseFetch<void>("/portal/auth/forgot-password", {
    method: "POST",
    body: input,
    authenticated: false,
  });
}
