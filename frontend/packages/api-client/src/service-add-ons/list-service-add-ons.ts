import { baseFetch } from "../http/base-fetch";
import type { ServiceAddOnView } from "./types";

/** GET /service-add-ons */
export function listServiceAddOns(): Promise<ServiceAddOnView[]> {
  return baseFetch<ServiceAddOnView[]>("/service-add-ons");
}
