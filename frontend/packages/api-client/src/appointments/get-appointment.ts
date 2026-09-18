import { baseFetch } from "../http/base-fetch";
import type { AppointmentView } from "./types";

/** GET /appointments/:id */
export function getAppointment(id: string): Promise<AppointmentView> {
  return baseFetch<AppointmentView>(`/appointments/${id}`);
}
