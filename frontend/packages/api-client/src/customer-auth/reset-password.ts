import { baseFetch } from "../http/base-fetch.js";
import type { ResetPasswordInput } from "./types.js";

// ASSUMPTION: POST /portal/auth/reset-password — route not confirmed yet, see types.ts.
export function resetPassword(input: ResetPasswordInput): Promise<void> {
  return baseFetch<void>("/portal/auth/reset-password", {
    method: "POST",
    body: input,
    authenticated: false,
  });
}
