import {
  createServiceAddOn as apiCreateServiceAddOn,
  type CreateServiceAddOnInput,
  type ServiceAddOnView,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "create service add-on" call. */
export function createServiceAddOn(input: CreateServiceAddOnInput): Promise<ServiceAddOnView> {
  return apiCreateServiceAddOn(input);
}
