import {
  listServiceAddOns as apiListServiceAddOns,
  type ServiceAddOnView,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "list service add-ons" call. */
export function listServiceAddOns(): Promise<ServiceAddOnView[]> {
  return apiListServiceAddOns();
}
