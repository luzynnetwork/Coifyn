import { startAppointment as apiStartAppointment, type AppointmentView } from "@coifyn/api-client";

/** Thin wrapper around the shared "start appointment" call. */
export function startAppointment(id: string): Promise<AppointmentView> {
  return apiStartAppointment(id);
}
