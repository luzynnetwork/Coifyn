import { arriveAppointment as apiArriveAppointment, type AppointmentView } from "@coifyn/api-client";

/** Thin wrapper around the shared "appointment arrived" call. */
export function arriveAppointment(id: string): Promise<AppointmentView> {
  return apiArriveAppointment(id);
}
