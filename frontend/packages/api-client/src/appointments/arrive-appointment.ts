import { baseFetch } from "../http/base-fetch";
import type { AppointmentView } from "./types";

/** POST /appointments/:id/arrive */
export function arriveAppointment(id: string): Promise<AppointmentView> {
  return baseFetch<AppointmentView>(`/appointments/${id}/arrive`, { method: "POST" });
}
