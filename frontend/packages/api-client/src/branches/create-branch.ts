import { baseFetch } from "../http/base-fetch";
import type { BranchView, CreateBranchInput } from "./types";

/** POST /branches */
export function createBranch(input: CreateBranchInput): Promise<BranchView> {
  return baseFetch<BranchView>("/branches", { method: "POST", body: input });
}
