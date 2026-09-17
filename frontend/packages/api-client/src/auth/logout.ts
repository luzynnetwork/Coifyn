import { baseFetch } from "../http/base-fetch";
import type { LogoutInput } from "./types";

/** POST /auth/logout — 204 No Content. */
export function logout(input: LogoutInput): Promise<void> {
  return baseFetch<void>("/auth/logout", {
    method: "POST",
    body: input,
  });
}
