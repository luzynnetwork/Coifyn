import { baseFetch } from "../http/base-fetch";
import type { SalonView, UpdateSalonInput } from "./types";

/** PATCH /salon */
export function updateSalon(input: UpdateSalonInput): Promise<SalonView> {
  return baseFetch<SalonView>("/salon", { method: "PATCH", body: input });
}
