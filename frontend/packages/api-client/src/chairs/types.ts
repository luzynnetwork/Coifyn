/** Chair wire types, mirrored from the `chair` drizzle table and backend/src/tenancy/dto/chair.dto.ts. */

export interface ChairView {
  id: string;
  salonId: string;
  branchId: string;
  label: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateChairInput {
  /** 1-60 chars, unique per branch (409 on duplicate). */
  label: string;
}

export interface UpdateChairInput {
  label?: string;
  isActive?: boolean;
}
