/** Revokes the session server-side and clears the cookies. */
export async function logout(): Promise<void> {
  await fetch("/api/session", { method: "DELETE" });
}
