import {
  createService as apiCreateService,
  type CreateServiceInput,
  type ServiceView,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "create service" call. */
export function createService(input: CreateServiceInput): Promise<ServiceView> {
  return apiCreateService(input);
}
