import {
  createServiceCategory as apiCreateServiceCategory,
  type CreateServiceCategoryInput,
  type ServiceCategoryView,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "create service category" call. */
export function createServiceCategory(
  input: CreateServiceCategoryInput,
): Promise<ServiceCategoryView> {
  return apiCreateServiceCategory(input);
}
