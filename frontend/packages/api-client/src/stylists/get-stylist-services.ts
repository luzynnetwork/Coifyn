import { baseFetch } from "../http/base-fetch";
import type { StylistServiceView } from "./types";

/** GET /stylists/:id/services */
export function getStylistServices(id: string): Promise<StylistServiceView[]> {
  return baseFetch<StylistServiceView[]>(`/stylists/${id}/services`);
}
