/** Branch wire types, mirrored from backend/src/tenancy/dto/branch.dto.ts. */

export interface BranchView {
  id: string;
  salonId: string;
  name: string;
  address: Record<string, unknown> | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateBranchInput {
  name: string;
  address?: Record<string, unknown>;
}

export interface UpdateBranchInput {
  name?: string;
  address?: Record<string, unknown>;
  isActive?: boolean;
}
