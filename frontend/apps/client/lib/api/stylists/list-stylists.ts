import { listStylists as apiListStylists, type StylistView } from "@coifyn/api-client";

/** Thin wrapper around the shared "list stylists" call. */
export function listStylists(): Promise<StylistView[]> {
  return apiListStylists();
}
