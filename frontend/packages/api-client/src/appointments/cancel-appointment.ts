import { baseFetch } from "../http/base-fetch";
import type { AppointmentView } from "./types";

/** POST /appointments/:id/cancel */
export function cancelAppointment(id: string): Promise<AppointmentView> {
  return baseFetch<AppointmentView>(`/appointments/${id}/cancel`, { method: "POST" });
}
