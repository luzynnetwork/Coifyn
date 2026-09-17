import { baseFetch } from "../http/base-fetch.js";
import type { MeView, UpdateMeInput } from "./types.js";

/** GET /auth/me */
export function getMe(): Promise<MeView> {
  return baseFetch<MeView>("/auth/me");
}

/** PATCH /auth/me */
export function updateMe(input: UpdateMeInput): Promise<MeView> {
  return baseFetch<MeView>("/auth/me", {
    method: "PATCH",
    body: input,
  });
}
