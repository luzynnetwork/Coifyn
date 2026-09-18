import { baseFetch } from "../http/base-fetch";
import type { AppointmentView } from "./types";

/** GET /appointments?branchId&date */
export function listAppointments(branchId: string, date: string): Promise<AppointmentView[]> {
  return baseFetch<AppointmentView[]>(`/appointments?branchId=${branchId}&date=${date}`);
}
