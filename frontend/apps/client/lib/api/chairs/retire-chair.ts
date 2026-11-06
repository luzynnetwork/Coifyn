import { retireChair as apiRetireChair } from "@coifyn/api-client";

/** Thin wrapper around the shared "retire chair" call. */
export function retireChair(id: string): Promise<void> {
  return apiRetireChair(id);
}
