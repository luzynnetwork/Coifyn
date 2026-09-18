import { baseFetch } from "../http/base-fetch";
import type { AppointmentView } from "./types";

/** POST /appointments/:id/no-show */
export function noShowAppointment(id: string): Promise<AppointmentView> {
  return baseFetch<AppointmentView>(`/appointments/${id}/no-show`, { method: "POST" });
}
