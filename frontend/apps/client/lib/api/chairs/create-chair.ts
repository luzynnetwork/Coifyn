import {
  createChair as apiCreateChair,
  type ChairView,
  type CreateChairInput,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "create chair" call. */
export function createChair(branchId: string, input: CreateChairInput): Promise<ChairView> {
  return apiCreateChair(branchId, input);
}
