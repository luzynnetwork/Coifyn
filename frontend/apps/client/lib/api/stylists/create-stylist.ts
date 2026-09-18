import {
  createStylist as apiCreateStylist,
  type CreateStylistInput,
  type StylistView,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "create stylist" call. */
export function createStylist(input: CreateStylistInput): Promise<StylistView> {
  return apiCreateStylist(input);
}
