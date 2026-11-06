import { baseFetch } from "../http/base-fetch";
import type { ServiceView } from "./types";

/** GET /services */
export function listServices(): Promise<ServiceView[]> {
  return baseFetch<ServiceView[]>("/services");
}
