import {
  completeAppointment as apiCompleteAppointment,
  type AppointmentView,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "complete appointment" call. */
export function completeAppointment(id: string): Promise<AppointmentView> {
  return apiCompleteAppointment(id);
}
