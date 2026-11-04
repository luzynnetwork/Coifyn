/** Wire types for the unauthenticated /public endpoints the customer app reads. */

export interface PublicStylist {
  id: string;
  branchId: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  specialties: string[];
  /** Live status: available | working | busy | on_break | off_shift | on_leave. */
  status: string;
  /** ISO time of the next open slot for the shortest service, if any in 7 days. */
  nextSlot: string | null;
}

export interface PublicService {
  id: string;
  name: string;
  description: string | null;
  basePriceMinor: number;
  baseDurationMin: number;
}

export interface PublicSalonView {
  salon: { slug: string; brandName: string; timezone: string };
  branches: { id: string; name: string }[];
  services: PublicService[];
  stylists: PublicStylist[];
}

export interface PublicSlot {
  startAt: string;
  endAt: string;
}

export interface SubmitBookingRequestInput {
  stylistId: string;
  serviceIds: string[];
  startAt: string;
  customerName: string;
  customerPhone: string;
  notes?: string;
}

export interface PublicQueueView {
  branchId: string;
  branchName: string;
  at: string;
  lanes: {
    stylistId: string;
    displayName: string;
    status: string;
    busy: boolean;
    waitingCount: number;
    estimatedMinutes: number;
  }[];
}
