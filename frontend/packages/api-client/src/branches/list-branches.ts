import { baseFetch } from "../http/base-fetch";
import type { BranchView } from "./types";

/** GET /branches */
export function listBranches(): Promise<BranchView[]> {
  return baseFetch<BranchView[]>("/branches");
}
