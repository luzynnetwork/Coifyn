import { baseFetch } from "../http/base-fetch.js";
import type { RegisterCustomerInput } from "./types.js";

// ASSUMPTION: POST /portal/auth/register — route not confirmed yet, see types.ts.
export function register(input: RegisterCustomerInput): Promise<void> {
  return baseFetch<void>("/portal/auth/register", {
    method: "POST",
    body: input,
    authenticated: false,
  });
}
