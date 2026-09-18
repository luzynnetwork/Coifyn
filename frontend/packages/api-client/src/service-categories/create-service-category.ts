import { baseFetch } from "../http/base-fetch";
import type { CreateServiceCategoryInput, ServiceCategoryView } from "./types";

/** POST /service-categories */
export function createServiceCategory(
  input: CreateServiceCategoryInput,
): Promise<ServiceCategoryView> {
  return baseFetch<ServiceCategoryView>("/service-categories", {
    method: "POST",
    body: input,
  });
}
