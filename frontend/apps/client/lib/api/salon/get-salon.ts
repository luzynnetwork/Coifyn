import { getSalon as apiGetSalon, type SalonView } from "@coifyn/api-client";

/** Thin wrapper around the shared "get salon" call. */
export function getSalon(): Promise<SalonView> {
  return apiGetSalon();
}
