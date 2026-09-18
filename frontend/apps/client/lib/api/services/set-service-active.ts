import { setServiceActive as apiSetServiceActive, type ServiceView } from "@coifyn/api-client";

/** Thin wrapper around the shared "set service active" call. */
export function setServiceActive(id: string, isActive: boolean): Promise<ServiceView> {
  return apiSetServiceActive(id, isActive);
}
