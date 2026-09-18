/** Salon wire types, mirrored from backend/src/tenancy/dto/salon.dto.ts. */

export interface SalonView {
  id: string;
  brandName: string;
  legalName: string;
  currency: string;
  timezone: string;
  taxProfile: Record<string, unknown> | null;
  createdAt: string;
}

export interface UpdateSalonInput {
  brandName?: string;
  legalName?: string;
  currency?: string;
  timezone?: string;
  taxProfile?: Record<string, unknown>;
}
