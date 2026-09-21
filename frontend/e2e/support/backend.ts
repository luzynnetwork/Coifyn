import type { APIRequestContext } from "@playwright/test";

/** Where the real API listens during browser tests (started by playwright.config.ts). */
export const API = "http://localhost:4000/api/v1";

export interface Owner {
  email: string;
  password: string;
  userId: string;
  accessToken: string;
  salonId: string;
  branchId: string;
  auth: { Authorization: string };
}

let seq = 0;

/** Registers a brand-new owner and onboards a salon, straight against the API. */
export async function createOwner(request: APIRequestContext): Promise<Owner> {
  const email = `owner.${Date.now()}.${++seq}@example.com`;
  const password = "correct horse battery staple";

  const reg = await request.post(`${API}/auth/register`, {
    data: { email, password, displayName: "Test Owner" },
  });
  if (!reg.ok()) throw new Error(`register failed: ${reg.status()}`);
  const registered = await reg.json();
  const accessToken = registered.tokens.accessToken as string;
  const auth = { Authorization: `Bearer ${accessToken}` };

  const onboard = await request.post(`${API}/onboarding/salon`, {
    headers: auth,
    data: { salonName: `Fade Room ${Date.now()}-${seq}` },
  });
  if (!onboard.ok()) throw new Error(`onboarding failed: ${onboard.status()}`);
  const salon = await onboard.json();

  return {
    email,
    password,
    userId: registered.userId,
    accessToken,
    salonId: salon.salon.id,
    branchId: salon.branch.id,
    auth,
  };
}
