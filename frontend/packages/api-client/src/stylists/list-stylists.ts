import { baseFetch } from "../http/base-fetch";
import type { StylistView } from "./types";

/** GET /stylists */
export function listStylists(): Promise<StylistView[]> {
  return baseFetch<StylistView[]>("/stylists");
}
