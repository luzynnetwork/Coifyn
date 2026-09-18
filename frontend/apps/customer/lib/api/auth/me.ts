import { getCustomerMe, type CustomerMeView } from "@coifyn/api-client";

/** Thin wrapper around the shared "who am I" customer call. */
export function me(): Promise<CustomerMeView> {
  return getCustomerMe();
}
