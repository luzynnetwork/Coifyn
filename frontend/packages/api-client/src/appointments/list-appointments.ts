import { baseFetch } from "../http/base-fetch";
import type { AppointmentView } from "./types";

/**
 * GET /appointments?branchId&date. `date` is the local calendar day
 * (YYYY-MM-DD) in the salon's timezone; both params are required.
 */
export function listAppointments(branchId: string, date: string): Promise<AppointmentView[]> {
  const params = new URLSearchParams({ branchId, date });
  return baseFetch<AppointmentView[]>(`/appointments?${params.toString()}`);
}
