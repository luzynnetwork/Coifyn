import {
  updateStylist as apiUpdateStylist,
  type StylistView,
  type UpdateStylistInput,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "update stylist" call. */
export function updateStylist(id: string, input: UpdateStylistInput): Promise<StylistView> {
  return apiUpdateStylist(id, input);
}
