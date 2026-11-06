import { baseFetch } from "../http/base-fetch";
import type { ServiceView } from "./types";

/** GET /services/:id */
export function getService(id: string): Promise<ServiceView> {
  return baseFetch<ServiceView>(`/services/${id}`);
}
