import { baseFetch } from "../http/base-fetch";
import type { MeView, UpdateMeInput } from "./types";

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
