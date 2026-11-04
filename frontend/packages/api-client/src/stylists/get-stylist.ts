import { baseFetch } from "../http/base-fetch";
import type { StylistView } from "./types";

/** GET /stylists/:id */
export function getStylist(id: string): Promise<StylistView> {
  return baseFetch<StylistView>(`/stylists/${id}`);
}
