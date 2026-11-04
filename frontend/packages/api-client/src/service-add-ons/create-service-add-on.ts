import { baseFetch } from "../http/base-fetch";
import type { CreateServiceAddOnInput, ServiceAddOnView } from "./types";

/** POST /service-add-ons */
export function createServiceAddOn(input: CreateServiceAddOnInput): Promise<ServiceAddOnView> {
  return baseFetch<ServiceAddOnView>("/service-add-ons", { method: "POST", body: input });
}
