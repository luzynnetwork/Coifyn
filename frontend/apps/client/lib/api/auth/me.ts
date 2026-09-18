import { getStaffMe, type MeView } from "@coifyn/api-client";

/** Thin wrapper around the shared "who am I" staff call. */
export function me(): Promise<MeView> {
  return getStaffMe();
}
