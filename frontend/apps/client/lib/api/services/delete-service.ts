import { deleteService as apiDeleteService } from "@coifyn/api-client";

/** Thin wrapper around the shared "delete service" call. */
export function deleteService(id: string): Promise<void> {
  return apiDeleteService(id);
}
