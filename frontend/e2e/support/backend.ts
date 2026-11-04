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

export interface Catalog {
  chairId: string;
  stylistId: string;
  haircutId: string;
  beardId: string;
}

async function post(
  request: APIRequestContext,
  owner: Owner,
  path: string,
  data: unknown,
) {
  const res = await request.post(`${API}${path}`, { headers: owner.auth, data });
  if (!res.ok()) {
    throw new Error(`POST ${path} -> ${res.status()} ${await res.text()}`);
  }
  return res.json();
}

/**
 * The shop the owner would set up in Phase 1 — a chair, a stylist, two
 * services ($20.00 haircut, $10.00 beard trim) and an 8% exclusive default tax.
 */
export async function seedCatalog(
  request: APIRequestContext,
  owner: Owner,
): Promise<Catalog> {
  const chair = await post(request, owner, `/branches/${owner.branchId}/chairs`, {
    label: "Chair 1",
  });
  const stylist = await post(request, owner, "/stylists", {
    userId: owner.userId,
    branchId: owner.branchId,
    displayName: "Ali",
  });
  const haircut = await post(request, owner, "/services", {
    name: "Haircut",
    basePriceMinor: 2000,
    baseDurationMin: 30,
  });
  const beard = await post(request, owner, "/services", {
    name: "Beard trim",
    basePriceMinor: 1000,
    baseDurationMin: 15,
  });
  await post(request, owner, "/tax-rates", {
    name: "Sales tax",
    percentBasisPoints: 800,
    inclusive: false,
    isDefault: true,
  });
  return {
    chairId: chair.id,
    stylistId: stylist.id,
    haircutId: haircut.id,
    beardId: beard.id,
  };
}

/** Invites and accepts a Front Desk user through the real staff endpoints. */
export async function createFrontDesk(
  request: APIRequestContext,
  owner: Owner,
): Promise<{ email: string; password: string }> {
  const rolesRes = await request.get(`${API}/roles`, { headers: owner.auth });
  const roles = (await rolesRes.json()) as { id: string; name: string }[];
  const frontDesk = roles.find((r) => r.name === "Front Desk");
  if (!frontDesk) throw new Error("Front Desk role not found");

  const email = `desk.${Date.now()}.${++seq}@example.com`;
  const password = "correct horse battery staple";
  const invite = await post(request, owner, "/staff/invites", {
    email,
    roleId: frontDesk.id,
    branchIds: [owner.branchId],
  });
  const accepted = await request.post(
    `${API}/staff/invites/${invite.token}/accept`,
    { data: { password, displayName: "Front Desk" } },
  );
  if (!accepted.ok()) {
    throw new Error(`accept invite -> ${accepted.status()} ${await accepted.text()}`);
  }
  return { email, password };
}
