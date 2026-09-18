import { baseFetch } from "../http/base-fetch";
import type { ServiceCategoryView, UpdateServiceCategoryInput } from "./types";

/** PATCH /service-categories/:id */
export function updateServiceCategory(
  id: string,
  input: UpdateServiceCategoryInput,
): Promise<ServiceCategoryView> {
  return baseFetch<ServiceCategoryView>(`/service-categories/${id}`, {
    method: "PATCH",
    body: input,
  });
}
