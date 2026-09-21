import { baseFetch } from "../http/base-fetch";
import type { SetStylistStatusInput, StylistStatusResult } from "./types";

/** POST /stylists/:id/status */
export function setStylistStatus(
  id: string,
  input: SetStylistStatusInput,
): Promise<StylistStatusResult> {
  return baseFetch<StylistStatusResult>(`/stylists/${id}/status`, {
    method: "POST",
    body: input,
  });
}
