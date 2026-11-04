import { baseFetch } from "../http/base-fetch";
import type { CloseRegisterSessionInput, RegisterSessionView } from "./types";

/** POST /register-sessions/:id/close */
export function closeRegisterSession(
  id: string,
  input: CloseRegisterSessionInput,
): Promise<RegisterSessionView> {
  return baseFetch<RegisterSessionView>(`/register-sessions/${id}/close`, {
    method: "POST",
    body: input,
  });
}
