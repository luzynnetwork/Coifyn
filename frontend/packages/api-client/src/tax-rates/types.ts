/** Tax rate wire types, mirrored from backend/src/salon-setup/dto/tax-rate.dto.ts. */

export interface TaxRateView {
  id: string;
  salonId: string;
  name: string;
  /** Basis points: 800 = 8.00%. */
  percentBasisPoints: number;
  inclusive: boolean;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface CreateTaxRateInput {
  name: string;
  percentBasisPoints: number;
  inclusive: boolean;
  isDefault?: boolean;
}

export interface UpdateTaxRateInput {
  name?: string;
  percentBasisPoints?: number;
  inclusive?: boolean;
  isDefault?: boolean;
  isActive?: boolean;
}
