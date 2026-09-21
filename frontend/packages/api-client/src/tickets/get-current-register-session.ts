import { baseFetch } from "../http/base-fetch";
import type { RegisterSessionView } from "./types";

/**
 * GET /register-sessions/current?branchId. The backend returns an empty 200
 * body (JSON null) when no register is open; that maps to `null` here.
 */
export async function getCurrentRegisterSession(
  branchId: string,
): Promise<RegisterSessionView | null> {
  const session = await baseFetch<RegisterSessionView | null | undefined>(
    `/register-sessions/current?branchId=${encodeURIComponent(branchId)}`,
  );
  return session ?? null;
}
