import { baseFetch } from "../http/base-fetch";
import type { SalonView } from "./types";

/** GET /salon */
export function getSalon(): Promise<SalonView> {
  return baseFetch<SalonView>("/salon");
}
