import { listServices as apiListServices, type ServiceView } from "@coifyn/api-client";

/** Thin wrapper around the shared "list services" call. */
export function listServices(): Promise<ServiceView[]> {
  return apiListServices();
}
