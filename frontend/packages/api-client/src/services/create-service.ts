import { baseFetch } from "../http/base-fetch";
import type { CreateServiceInput, ServiceView } from "./types";

/** POST /services */
export function createService(input: CreateServiceInput): Promise<ServiceView> {
  return baseFetch<ServiceView>("/services", { method: "POST", body: input });
}
