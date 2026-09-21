/** Branch closure wire types, mirrored from the `branch_closure` drizzle table and dto/branch-closure.dto.ts. */

export interface BranchClosureView {
  id: string;
  salonId: string;
  branchId: string;
  /** "YYYY-MM-DD". */
  startsOn: string;
  endsOn: string;
  reason: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBranchClosureInput {
  /** ISO date; endsOn must not be before startsOn. */
  startsOn: string;
  endsOn: string;
  /** 1-200 chars. */
  reason: string;
}
