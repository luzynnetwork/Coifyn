import { baseFetch } from "../http/base-fetch";
import type { StylistView, UpdateStylistInput } from "./types";

/** PATCH /stylists/:id */
export function updateStylist(id: string, input: UpdateStylistInput): Promise<StylistView> {
  return baseFetch<StylistView>(`/stylists/${id}`, { method: "PATCH", body: input });
}
