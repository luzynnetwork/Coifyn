import { baseFetch } from "../http/base-fetch";
import type { ServiceAddOnView, UpdateServiceAddOnInput } from "./types";

/** PATCH /service-add-ons/:id */
export function updateServiceAddOn(
  id: string,
  input: UpdateServiceAddOnInput,
): Promise<ServiceAddOnView> {
  return baseFetch<ServiceAddOnView>(`/service-add-ons/${id}`, {
    method: "PATCH",
    body: input,
  });
}
