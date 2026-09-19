import {
  updateCustomer as apiUpdateCustomer,
  type CustomerView,
  type UpdateCustomerInput,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "update customer" call. */
export function updateCustomer(id: string, input: UpdateCustomerInput): Promise<CustomerView> {
  return apiUpdateCustomer(id, input);
}
