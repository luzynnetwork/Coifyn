import {
  createCustomer as apiCreateCustomer,
  type CreateCustomerInput,
  type CustomerView,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "create customer" call. */
export function createCustomer(input: CreateCustomerInput): Promise<CustomerView> {
  return apiCreateCustomer(input);
}
