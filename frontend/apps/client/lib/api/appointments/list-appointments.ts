import { listAppointments as apiListAppointments, type AppointmentView } from "@coifyn/api-client";

/** Thin wrapper around the shared "list appointments" call. */
export function listAppointments(branchId: string, date: string): Promise<AppointmentView[]> {
  return apiListAppointments(branchId, date);
}
