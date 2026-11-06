import {
  putStylistServices as apiPutStylistServices,
  type PutStylistServicesInput,
  type StylistServiceView,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "put stylist services" call. */
export function putStylistServices(
  id: string,
  input: PutStylistServicesInput,
): Promise<StylistServiceView[]> {
  return apiPutStylistServices(id, input);
}
