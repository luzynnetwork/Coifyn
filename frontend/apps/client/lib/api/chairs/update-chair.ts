import {
  updateChair as apiUpdateChair,
  type ChairView,
  type UpdateChairInput,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "update chair" call. */
export function updateChair(id: string, input: UpdateChairInput): Promise<ChairView> {
  return apiUpdateChair(id, input);
}
