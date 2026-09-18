/** Stylist wire types — documented contract, see phases/phase-1-salon-core.md. */

export type StylistStatus =
  | "available"
  | "working"
  | "busy"
  | "on_break"
  | "off_shift"
  | "on_leave";

export interface StylistView {
  id: string;
  userId: string;
  salonId: string;
  branchId: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  specialties: string[];
  status: StylistStatus;
  isBookable: boolean;
  startedAt: string;
  createdAt: string;
}

export interface CreateStylistInput {
  userId: string;
  branchId: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  specialties?: string[];
  isBookable?: boolean;
}

export interface UpdateStylistInput {
  branchId?: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  specialties?: string[];
  isBookable?: boolean;
}

export interface SetStylistStatusInput {
  status: StylistStatus;
  reason?: string;
}

export interface StylistServiceView {
  stylistId: string;
  serviceId: string;
  canPerform: boolean;
  priceOverrideMinor: number | null;
  durationOverrideMin: number | null;
}

export interface PutStylistServicesInput {
  services: Array<{
    serviceId: string;
    canPerform: boolean;
    priceOverrideMinor?: number;
    durationOverrideMin?: number;
  }>;
}
