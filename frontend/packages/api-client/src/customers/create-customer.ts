import { baseFetch } from "../http/base-fetch";
import type { CreateCustomerInput, CustomerView } from "./types";

/** POST /customers */
export function createCustomer(input: CreateCustomerInput): Promise<CustomerView> {
  return baseFetch<CustomerView>("/customers", { method: "POST", body: input });
}
