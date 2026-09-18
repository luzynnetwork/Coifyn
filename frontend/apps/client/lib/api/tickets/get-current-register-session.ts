import {
  getCurrentRegisterSession as apiGetCurrentRegisterSession,
  type RegisterSessionView,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "current register session" call. */
export function getCurrentRegisterSession(branchId: string): Promise<RegisterSessionView | null> {
  return apiGetCurrentRegisterSession(branchId);
}
