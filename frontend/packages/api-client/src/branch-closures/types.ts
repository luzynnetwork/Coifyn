/** Branch closure wire types, mirrored from backend/src/salon-setup/dto/branch-closure.dto.ts. */

export interface BranchClosureView {
  id: string;
  branchId: string;
  startsOn: string;
  endsOn: string;
  reason: string;
  createdAt: string;
}

export interface CreateBranchClosureInput {
  startsOn: string;
  endsOn: string;
  reason: string;
}
