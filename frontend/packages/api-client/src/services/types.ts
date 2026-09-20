/**
 * Service wire types, mirrored from the `service` drizzle table and
 * backend/src/services/dto/service.dto.ts. Money is integer minor units.
 */

export interface ServiceView {
  id: string;
  salonId: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  /** Integer minor currency units (e.g. cents). */
  basePriceMinor: number;
  baseDurationMin: number;
  taxRateId: string | null;
  isBookable: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateServiceInput {
  /** 1-120 chars. */
  name: string;
  categoryId?: string;
  description?: string;
  /** Integer minor units, >= 0. */
  basePriceMinor: number;
  /** Minutes, integer >= 0. */
  baseDurationMin: number;
  taxRateId?: string;
  isBookable?: boolean;
  /** Add-ons this service offers; replaces the full set on write. */
  addOnIds?: string[];
}

export interface UpdateServiceInput {
  name?: string;
  categoryId?: string;
  description?: string;
  basePriceMinor?: number;
  baseDurationMin?: number;
  taxRateId?: string;
  isBookable?: boolean;
  addOnIds?: string[];
}
