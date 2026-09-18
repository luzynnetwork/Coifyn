import { baseFetch } from "../http/base-fetch";
import type { AppointmentView } from "./types";

/** POST /appointments/:id/complete */
export function completeAppointment(id: string): Promise<AppointmentView> {
  return baseFetch<AppointmentView>(`/appointments/${id}/complete`, { method: "POST" });
}
