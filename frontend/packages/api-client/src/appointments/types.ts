/** Appointment wire types — documented contract, see phases/phase-1-salon-core.md. */

export type AppointmentStatus =
  | "booked"
  | "arrived"
  | "in_service"
  | "completed"
  | "no_show"
  | "cancelled";

export interface AppointmentView {
  id: string;
  branchId: string;
  stylistId: string;
  chairId: string | null;
  customerRef: string;
  serviceIds: string[];
  addOnIds: string[];
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  source: "front_desk";
  notes: string | null;
  createdAt: string;
}

export interface CreateAppointmentInput {
  branchId: string;
  stylistId: string;
  chairId?: string;
  customerRef: string;
  serviceIds: string[];
  addOnIds?: string[];
  startAt: string;
  endAt: string;
  notes?: string;
}

export interface UpdateAppointmentInput {
  stylistId?: string;
  chairId?: string;
  serviceIds?: string[];
  addOnIds?: string[];
  startAt?: string;
  endAt?: string;
  notes?: string;
}
