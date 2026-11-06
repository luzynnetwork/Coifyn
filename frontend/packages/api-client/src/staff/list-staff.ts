import { baseFetch } from "../http/base-fetch";
import type { StaffMemberView } from "./types";

/** GET /staff */
export function listStaff(): Promise<StaffMemberView[]> {
  return baseFetch<StaffMemberView[]>("/staff");
}
