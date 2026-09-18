import { baseFetch } from "../http/base-fetch";
import type { OpenRegisterSessionInput, RegisterSessionView } from "./types";

/** POST /register-sessions */
export function openRegisterSession(
  input: OpenRegisterSessionInput,
): Promise<RegisterSessionView> {
  return baseFetch<RegisterSessionView>("/register-sessions", { method: "POST", body: input });
}
