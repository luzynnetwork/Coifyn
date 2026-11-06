import {
  setStylistStatus as apiSetStylistStatus,
  type SetStylistStatusInput,
  type StylistStatusResult,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "set stylist status" call. */
export function setStylistStatus(
  id: string,
  input: SetStylistStatusInput,
): Promise<StylistStatusResult> {
  return apiSetStylistStatus(id, input);
}
