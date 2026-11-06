import {
  updateService as apiUpdateService,
  type ServiceView,
  type UpdateServiceInput,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "update service" call. */
export function updateService(id: string, input: UpdateServiceInput): Promise<ServiceView> {
  return apiUpdateService(id, input);
}
