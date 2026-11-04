/** Branch wire types, mirrored from the `branch` drizzle table and backend/src/tenancy/dto/branch.dto.ts. */

export interface BranchView {
  id: string;
  salonId: string;
  name: string;
  address: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
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
