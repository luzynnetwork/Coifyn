import { baseFetch } from "../http/base-fetch";
import type {
  PublicQueueView,
  PublicSalonView,
  PublicSlot,
  SubmitBookingRequestInput,
} from "./types";

const q = encodeURIComponent;
const open = { authenticated: false } as const;

export const getPublicSalon = (slug: string) =>
  baseFetch<PublicSalonView>(`/public/salons/${q(slug)}`, open);

export const getPublicSlots = (slug: string, stylistId: string, serviceIds: string[], date: string) =>
  baseFetch<PublicSlot[]>(
    `/public/salons/${q(slug)}/slots?stylistId=${q(stylistId)}&serviceIds=${serviceIds.map(q).join(",")}&date=${date}`,
    open,
  );

export const submitBookingRequest = (slug: string, input: SubmitBookingRequestInput) =>
  baseFetch<{ id: string; status: string; startAt: string; endAt: string }>(
    `/public/salons/${q(slug)}/booking-requests`,
    { ...open, method: "POST", body: input },
  );

export const getPublicQueue = (branchId: string) =>
  baseFetch<PublicQueueView>(`/public/branches/${q(branchId)}/queue`, open);
