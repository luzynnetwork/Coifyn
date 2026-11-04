import { baseFetch } from "../http/base-fetch";
import type { ChairView, UpdateChairInput } from "./types";

/** PATCH /chairs/:id */
export function updateChair(id: string, input: UpdateChairInput): Promise<ChairView> {
  return baseFetch<ChairView>(`/chairs/${id}`, { method: "PATCH", body: input });
}
