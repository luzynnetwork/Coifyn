import {
  noShowAppointment as apiNoShowAppointment,
  type AppointmentView,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "appointment no-show" call. */
export function noShowAppointment(id: string): Promise<AppointmentView> {
  return apiNoShowAppointment(id);
}
