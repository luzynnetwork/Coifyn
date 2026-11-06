import {
  updateSalon as apiUpdateSalon,
  type SalonView,
  type UpdateSalonInput,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "update salon" call. */
export function updateSalon(input: UpdateSalonInput): Promise<SalonView> {
  return apiUpdateSalon(input);
}
