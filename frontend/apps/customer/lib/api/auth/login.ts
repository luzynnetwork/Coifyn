import {
  customerLogin,
  type CustomerAuthTokens,
  type LoginCustomerInput,
} from "@coifyn/api-client";

/** Thin wrapper around the shared customer login call. */
export function login(input: LoginCustomerInput): Promise<CustomerAuthTokens> {
  return customerLogin(input);
}
