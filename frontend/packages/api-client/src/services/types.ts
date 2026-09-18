/** Service wire types — documented contract, see phases/phase-1-salon-core.md. */

export interface ServiceView {
  id: string;
  salonId: string;
  categoryId: string;
  name: string;
  description: string | null;
  basePriceMinor: number;
  baseDurationMin: number;
  taxRateId: string | null;
  isBookable: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface CreateServiceInput {
  categoryId: string;
  name: string;
  description?: string;
  basePriceMinor: number;
  baseDurationMin: number;
  taxRateId?: string;
  isBookable?: boolean;
}

export interface UpdateServiceInput {
  categoryId?: string;
  name?: string;
  description?: string;
  basePriceMinor?: number;
  baseDurationMin?: number;
  taxRateId?: string;
  isBookable?: boolean;
}
