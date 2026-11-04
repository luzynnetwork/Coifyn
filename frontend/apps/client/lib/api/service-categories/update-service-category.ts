import {
  updateServiceCategory as apiUpdateServiceCategory,
  type ServiceCategoryView,
  type UpdateServiceCategoryInput,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "update service category" call. */
export function updateServiceCategory(
  id: string,
  input: UpdateServiceCategoryInput,
): Promise<ServiceCategoryView> {
  return apiUpdateServiceCategory(id, input);
}
