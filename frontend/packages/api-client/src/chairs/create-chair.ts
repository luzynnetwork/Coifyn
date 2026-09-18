import { baseFetch } from "../http/base-fetch";
import type { ChairView, CreateChairInput } from "./types";

/** POST /branches/:branchId/chairs */
export function createChair(branchId: string, input: CreateChairInput): Promise<ChairView> {
  return baseFetch<ChairView>(`/branches/${branchId}/chairs`, { method: "POST", body: input });
}
