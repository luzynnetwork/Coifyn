import { staffLogout, type LogoutInput } from "@coifyn/api-client";

/** Thin wrapper around the shared staff logout call. */
export function logout(input: LogoutInput): Promise<void> {
  return staffLogout(input);
}
