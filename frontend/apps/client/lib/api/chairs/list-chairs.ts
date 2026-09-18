import { listChairs as apiListChairs, type ChairView } from "@coifyn/api-client";

/** Thin wrapper around the shared "list chairs" call. */
export function listChairs(branchId: string): Promise<ChairView[]> {
  return apiListChairs(branchId);
}
