/**
 * Appointment wire types, mirrored from the `appointment` drizzle table and
 * backend/src/appointments/dto/appointment.dto.ts.
 */

export type AppointmentStatus =
  | "booked"
  | "arrived"
  | "in_service"
  | "completed"
  | "no_show"
  | "cancelled";

/** `appointment` row, returned by every appointments endpoint. */
export interface AppointmentView {
  id: string;
  salonId: string;
  branchId: string;
  stylistId: string;
  chairId: string | null;
  customerId: string | null;
  serviceIds: string[];
  addOnIds: string[];
  /** ISO timestamps (UTC). */
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  source: string;
  notes: string | null;
  /** Set when a stand-in took over: the stylist the customer chose. */
  originalStylistId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateAppointmentInput {
  branchId: string;
  stylistId: string;
  chairId?: string;
  customerId?: string;
  /** 1-20 service ids. */
  serviceIds: string[];
  /** At most 20. */
  addOnIds?: string[];
  /** ISO date-time; endAt must be after startAt. */
  startAt: string;
  endAt: string;
  /** Max 1000 chars. */
  notes?: string;
  /**
   * Books over a conflicting appointment. Needs appointment:override; without
   * it a clash is a 409. Min 3 chars, audited.
   */
  overrideReason?: string;
}

/** Service and add-on lists cannot be edited after booking (not in the backend DTO). */
export interface UpdateAppointmentInput {
  stylistId?: string;
  chairId?: string;
  startAt?: string;
  endAt?: string;
  notes?: string;
  /** Min 3 chars; needed to move onto a conflicting slot (appointment:override). */
  overrideReason?: string;
}
