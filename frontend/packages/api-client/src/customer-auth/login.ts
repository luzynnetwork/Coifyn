import { baseFetch } from "../http/base-fetch";
import type { CustomerAuthTokens, LoginCustomerInput } from "./types";

// ASSUMPTION: POST /portal/auth/login — route not confirmed yet, see types.ts.
export function login(input: LoginCustomerInput): Promise<CustomerAuthTokens> {
  return baseFetch<CustomerAuthTokens>("/portal/auth/login", {
    method: "POST",
    body: input,
    authenticated: false,
  });
}
