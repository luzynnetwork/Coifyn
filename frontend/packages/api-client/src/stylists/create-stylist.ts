import { baseFetch } from "../http/base-fetch";
import type { CreateStylistInput, StylistView } from "./types";

/** POST /stylists */
export function createStylist(input: CreateStylistInput): Promise<StylistView> {
  return baseFetch<StylistView>("/stylists", { method: "POST", body: input });
}
