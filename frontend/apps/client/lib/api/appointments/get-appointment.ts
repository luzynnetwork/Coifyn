import { getAppointment as apiGetAppointment, type AppointmentView } from "@coifyn/api-client";

/** Thin wrapper around the shared "get appointment" call. */
export function getAppointment(id: string): Promise<AppointmentView> {
  return apiGetAppointment(id);
}
