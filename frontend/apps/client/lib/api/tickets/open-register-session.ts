import {
  openRegisterSession as apiOpenRegisterSession,
  type OpenRegisterSessionInput,
  type RegisterSessionView,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "open register session" call. */
export function openRegisterSession(
  input: OpenRegisterSessionInput,
): Promise<RegisterSessionView> {
  return apiOpenRegisterSession(input);
}
