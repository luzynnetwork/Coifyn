import { baseFetch } from "../http/base-fetch";
import type { PutStylistServicesInput, StylistServiceView } from "./types";

/** PUT /stylists/:id/services */
export function putStylistServices(
  id: string,
  input: PutStylistServicesInput,
): Promise<StylistServiceView[]> {
  return baseFetch<StylistServiceView[]>(`/stylists/${id}/services`, {
    method: "PUT",
    body: input,
  });
}
