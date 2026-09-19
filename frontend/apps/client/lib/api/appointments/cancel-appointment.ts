import {
  cancelAppointment as apiCancelAppointment,
  type AppointmentView,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "cancel appointment" call. */
export function cancelAppointment(id: string): Promise<AppointmentView> {
  return apiCancelAppointment(id);
}
