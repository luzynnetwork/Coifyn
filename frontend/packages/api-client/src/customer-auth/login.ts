import { baseFetch } from "../http/base-fetch.js";
import type { CustomerAuthTokens, LoginCustomerInput } from "./types.js";

// ASSUMPTION: POST /portal/auth/login — route not confirmed yet, see types.ts.
export function login(input: LoginCustomerInput): Promise<CustomerAuthTokens> {
  return baseFetch<CustomerAuthTokens>("/portal/auth/login", {
    method: "POST",
    body: input,
    authenticated: false,
  });
}
