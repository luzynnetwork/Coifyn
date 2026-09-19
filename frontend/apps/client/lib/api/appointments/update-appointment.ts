import {
  updateAppointment as apiUpdateAppointment,
  type AppointmentView,
  type UpdateAppointmentInput,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "update appointment" call. */
export function updateAppointment(
  id: string,
  input: UpdateAppointmentInput,
): Promise<AppointmentView> {
  return apiUpdateAppointment(id, input);
}
