/** Customer wire types, mirrored from the `salon_customer` drizzle table and customer.dto.ts. */

export interface CustomerView {
  id: string;
  salonId: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  firstSeenAt: string;
  lastVisitAt: string | null;
  visitCount: number;
  /** Integer minor units. */
  totalSpendMinor: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateCustomerInput {
  /** 1-120 chars. */
  name: string;
  /** 5-30 chars, unique per salon (409 on duplicate). */
  phone: string;
  email?: string;
  /** Max 2000 chars. */
  notes?: string;
}

export interface UpdateCustomerInput {
  name?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

/** Phase 1 always returns an empty list (no visit-history table until Phase 2). */
export interface CustomerVisitView {
  ticketId: string;
  visitedAt: string;
  totalMinor: number;
}
