import { baseFetch } from "../http/base-fetch";
import type { SetStylistStatusInput, StylistView } from "./types";

/** POST /stylists/:id/status */
export function setStylistStatus(
  id: string,
  input: SetStylistStatusInput,
): Promise<StylistView> {
  return baseFetch<StylistView>(`/stylists/${id}/status`, { method: "POST", body: input });
}
