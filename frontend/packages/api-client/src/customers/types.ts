/** Customer wire types — documented contract, see phases/phase-1-salon-core.md. */

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
  totalSpendMinor: number;
}

export interface CreateCustomerInput {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
}

export interface UpdateCustomerInput {
  name?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface CustomerVisitView {
  ticketId: string;
  visitedAt: string;
  totalMinor: number;
}
