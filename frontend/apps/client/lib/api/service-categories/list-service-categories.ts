import {
  listServiceCategories as apiListServiceCategories,
  type ServiceCategoryView,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "list service categories" call. */
export function listServiceCategories(): Promise<ServiceCategoryView[]> {
  return apiListServiceCategories();
}
