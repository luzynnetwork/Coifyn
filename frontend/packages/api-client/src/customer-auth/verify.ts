import { baseFetch } from "../http/base-fetch.js";
import type { CustomerAuthTokens, VerifyCustomerInput } from "./types.js";

// ASSUMPTION: POST /portal/auth/verify — route not confirmed yet, see types.ts.
export function verify(input: VerifyCustomerInput): Promise<CustomerAuthTokens> {
  return baseFetch<CustomerAuthTokens>("/portal/auth/verify", {
    method: "POST",
    body: input,
    authenticated: false,
  });
}
