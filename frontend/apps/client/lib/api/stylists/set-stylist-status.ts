import {
  setStylistStatus as apiSetStylistStatus,
  type SetStylistStatusInput,
  type StylistView,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "set stylist status" call. */
export function setStylistStatus(
  id: string,
  input: SetStylistStatusInput,
): Promise<StylistView> {
  return apiSetStylistStatus(id, input);
}
