import {
  updateServiceAddOn as apiUpdateServiceAddOn,
  type ServiceAddOnView,
  type UpdateServiceAddOnInput,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "update service add-on" call. */
export function updateServiceAddOn(
  id: string,
  input: UpdateServiceAddOnInput,
): Promise<ServiceAddOnView> {
  return apiUpdateServiceAddOn(id, input);
}
