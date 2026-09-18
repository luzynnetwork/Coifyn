/** Chair wire types, mirrored from backend/src/tenancy/dto/chair.dto.ts. */

export interface ChairView {
  id: string;
  branchId: string;
  label: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateChairInput {
  label: string;
}

export interface UpdateChairInput {
  label?: string;
  isActive?: boolean;
}
