import { baseFetch } from "../http/base-fetch";
import type { ServiceView } from "./types";

/** POST /services/:id/active */
export function setServiceActive(id: string, isActive: boolean): Promise<ServiceView> {
  return baseFetch<ServiceView>(`/services/${id}/active`, {
    method: "POST",
    body: { isActive },
  });
}
