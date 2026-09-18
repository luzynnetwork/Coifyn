import { baseFetch } from "../http/base-fetch";
import type { AppointmentView } from "./types";

/** POST /appointments/:id/start */
export function startAppointment(id: string): Promise<AppointmentView> {
  return baseFetch<AppointmentView>(`/appointments/${id}/start`, { method: "POST" });
}
