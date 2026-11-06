import {
  createAppointment as apiCreateAppointment,
  type AppointmentView,
  type CreateAppointmentInput,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "create appointment" call. */
export function createAppointment(input: CreateAppointmentInput): Promise<AppointmentView> {
  return apiCreateAppointment(input);
}
