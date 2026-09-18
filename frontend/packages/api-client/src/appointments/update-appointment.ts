import { baseFetch } from "../http/base-fetch";
import type { AppointmentView, UpdateAppointmentInput } from "./types";

/** PATCH /appointments/:id */
export function updateAppointment(
  id: string,
  input: UpdateAppointmentInput,
): Promise<AppointmentView> {
  return baseFetch<AppointmentView>(`/appointments/${id}`, { method: "PATCH", body: input });
}
