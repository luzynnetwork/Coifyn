import { baseFetch } from "../http/base-fetch";
import type { ServiceView, UpdateServiceInput } from "./types";

/** PATCH /services/:id */
export function updateService(id: string, input: UpdateServiceInput): Promise<ServiceView> {
  return baseFetch<ServiceView>(`/services/${id}`, { method: "PATCH", body: input });
}
