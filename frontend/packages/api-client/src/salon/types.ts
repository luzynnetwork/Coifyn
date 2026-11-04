/** Salon wire types, mirrored from backend/src/tenancy (publicSalon) and dto/salon.dto.ts. */

export interface SalonView {
  id: string;
  slug: string;
  brandName: string;
  legalName: string;
  currency: string;
  timezone: string;
  status: string;
  /** Only present on GET /salon: the caller's role name in this salon. */
  yourRole?: string | null;
}

export interface UpdateSalonInput {
  brandName?: string;
  legalName?: string;
  /** 3-letter ISO currency code. */
  currency?: string;
  timezone?: string;
  taxProfile?: Record<string, unknown>;
}
