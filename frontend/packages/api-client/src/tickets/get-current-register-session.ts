import { baseFetch } from "../http/base-fetch";
import type { RegisterSessionView } from "./types";

/** GET /register-sessions/current */
export function getCurrentRegisterSession(branchId: string): Promise<RegisterSessionView | null> {
  return baseFetch<RegisterSessionView | null>(`/register-sessions/current?branchId=${branchId}`);
}
