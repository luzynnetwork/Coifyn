/**
 * Stylist wire types, mirrored from the `stylist_profile` / `stylist_service`
 * drizzle tables and backend/src/stylists/dto/stylist.dto.ts.
 */

export type StylistStatus =
  | "available"
  | "working"
  | "busy"
  | "on_break"
  | "off_shift"
  | "on_leave";

export interface StylistView {
  id: string;
  salonId: string;
  userId: string;
  /** Home branch. */
  branchId: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  specialties: string[];
  status: StylistStatus;
  isBookable: boolean;
  startedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateStylistInput {
  /** Must be an existing member of the salon. */
  userId: string;
  branchId: string;
  /** 1-120 chars. */
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  /** At most 20 entries. */
  specialties?: string[];
  isBookable?: boolean;
  /** ISO date string. */
  startedAt?: string;
}

export interface UpdateStylistInput {
  branchId?: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  specialties?: string[];
  isBookable?: boolean;
  startedAt?: string;
}

export interface SetStylistStatusInput {
  status: StylistStatus;
  /** Max 500 chars. */
  reason?: string;
}

/** POST /stylists/:id/status returns the updated profile plus the bookings the change affects. */
export interface StylistStatusResult extends StylistView {
  affectedBookings: unknown[];
}

/** `stylist_service` row, returned by GET/PUT /stylists/:id/services. */
export interface StylistServiceView {
  id: string;
  salonId: string;
  stylistId: string;
  serviceId: string;
  /** Integer minor units, null falls back to the service base price. */
  priceOverrideMinor: number | null;
  /** Minutes, null falls back to the service base duration. */
  durationOverrideMin: number | null;
  canPerform: boolean;
  createdAt: string;
  updatedAt: string;
}

/** One entry of the service matrix sent on PUT. */
export interface StylistServiceEntry {
  serviceId: string;
  priceOverrideMinor: number | null;
  durationOverrideMin: number | null;
  canPerform: boolean;
}

/**
 * PUT /stylists/:id/services replaces the whole matrix. The body key is
 * `entries` (backend SetStylistServicesDto), not `services`.
 */
export interface PutStylistServicesInput {
  entries: StylistServiceEntry[];
}
