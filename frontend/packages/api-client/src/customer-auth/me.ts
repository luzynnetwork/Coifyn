import { baseFetch } from "../http/base-fetch";
import type { CustomerMeView, UpdateCustomerMeInput } from "./types";

// ASSUMPTION: GET /portal/me — route not confirmed yet, see types.ts.
export function getMe(): Promise<CustomerMeView> {
  return baseFetch<CustomerMeView>("/portal/me");
}

// ASSUMPTION: PATCH /portal/me — route not confirmed yet, see types.ts.
export function updateMe(input: UpdateCustomerMeInput): Promise<CustomerMeView> {
  return baseFetch<CustomerMeView>("/portal/me", {
    method: "PATCH",
    body: input,
  });
}
