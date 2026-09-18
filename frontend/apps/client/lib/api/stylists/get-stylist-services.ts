import {
  getStylistServices as apiGetStylistServices,
  type StylistServiceView,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "get stylist services" call. */
export function getStylistServices(id: string): Promise<StylistServiceView[]> {
  return apiGetStylistServices(id);
}
