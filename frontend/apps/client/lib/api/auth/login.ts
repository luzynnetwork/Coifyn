export interface LoginInput {
  email: string;
  password: string;
}

/**
 * Signs in through this app's own /api/session, which stores the tokens in
 * httpOnly cookies. Nothing token-shaped ever reaches page JavaScript.
 */
export async function login(input: LoginInput): Promise<void> {
  const response = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error("invalid_credentials");
}
