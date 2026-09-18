import {
  closeRegisterSession as apiCloseRegisterSession,
  type CloseRegisterSessionInput,
  type RegisterSessionView,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "close register session" call. */
export function closeRegisterSession(
  id: string,
  input: CloseRegisterSessionInput,
): Promise<RegisterSessionView> {
  return apiCloseRegisterSession(id, input);
}
