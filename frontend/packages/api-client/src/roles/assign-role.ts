import { baseFetch } from "../http/base-fetch";

/** POST /members/:userId/role */
export function assignRole(userId: string, roleId: string): Promise<void> {
  return baseFetch<void>(`/members/${userId}/role`, {
    method: "POST",
    body: { roleId },
  });
}
