import { baseFetch } from "../http/base-fetch";
import type { ServiceCategoryView } from "./types";

/** GET /service-categories */
export function listServiceCategories(): Promise<ServiceCategoryView[]> {
  return baseFetch<ServiceCategoryView[]>("/service-categories");
}
