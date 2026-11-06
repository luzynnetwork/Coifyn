import { getStylist as apiGetStylist, type StylistView } from "@coifyn/api-client";

/** Thin wrapper around the shared "get stylist" call. */
export function getStylist(id: string): Promise<StylistView> {
  return apiGetStylist(id);
}
