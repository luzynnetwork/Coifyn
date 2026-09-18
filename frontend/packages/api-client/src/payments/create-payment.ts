import { baseFetch } from "../http/base-fetch";
import type { CreatePaymentInput, PaymentView } from "./types";

/** POST /payments */
export function createPayment(input: CreatePaymentInput): Promise<PaymentView> {
  return baseFetch<PaymentView>("/payments", { method: "POST", body: input });
}
