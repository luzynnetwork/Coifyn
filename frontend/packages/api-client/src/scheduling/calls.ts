import { baseFetch } from "../http/base-fetch";
import type { AppointmentView } from "../appointments/types";
import type {
  AffectedAppointment,
  BookingRequestView,
  DaySheetView,
  DisruptionKind,
  DisruptionOfferView,
  DisruptionView,
  FrontDeskBoardView,
  OfferChoice,
  QueueBoardView,
  RescheduleInput,
} from "./types";

const q = encodeURIComponent;

// ── appointments ───────────────────────────────────────────────────────────
export const getFrontDeskBoard = (branchId: string, date: string) =>
  baseFetch<FrontDeskBoardView>(`/front-desk/board?branchId=${q(branchId)}&date=${date}`);

export const getDaySheet = (stylistId: string, date: string) =>
  baseFetch<DaySheetView>(`/appointments/day-sheet?stylistId=${q(stylistId)}&date=${date}`);

export const rescheduleAppointment = (id: string, input: RescheduleInput) =>
  baseFetch<AppointmentView>(`/appointments/${q(id)}/reschedule`, {
    method: "POST",
    body: input,
  });

/** Hand the booking to a stand-in; the original stylist stays credited. */
export const reassignStylist = (id: string, stylistId: string, reason?: string) =>
  baseFetch<AppointmentView>(`/appointments/${q(id)}/reassign-stylist`, {
    method: "POST",
    body: { stylistId, reason },
  });

export const clockStylist = (id: string, direction: "in" | "out") =>
  baseFetch<{ stylistId: string; status: string }>(`/stylists/${q(id)}/clock-${direction}`, {
    method: "POST",
  });

// ── live queue ─────────────────────────────────────────────────────────────
export const getQueueBoard = (branchId: string) =>
  baseFetch<QueueBoardView>(`/queue/board?branchId=${q(branchId)}`);

export const switchQueueStylist = (entryId: string, stylistId: string) =>
  baseFetch<unknown>(`/queue/${q(entryId)}/switch-stylist`, {
    method: "POST",
    body: { stylistId },
  });

// ── disruptions ────────────────────────────────────────────────────────────
export const listDisruptions = (branchId: string, status?: "open" | "resolved") =>
  baseFetch<DisruptionView[]>(
    `/disruptions?branchId=${q(branchId)}${status ? `&status=${status}` : ""}`,
  );

export const declareDisruption = (input: {
  stylistId: string;
  kind: DisruptionKind;
  minutesLate?: number;
}) => baseFetch<DisruptionView>("/disruptions", { method: "POST", body: input });

export const declareRunningLate = (stylistId: string, minutes: number) =>
  baseFetch<DisruptionView>(`/stylists/${q(stylistId)}/running-late`, {
    method: "POST",
    body: { minutes },
  });

export const listAffected = (disruptionId: string) =>
  baseFetch<AffectedAppointment[]>(`/disruptions/${q(disruptionId)}/affected`);

export const notifyDisruption = (disruptionId: string) =>
  baseFetch<{ notified: number; offers: DisruptionOfferView[] }>(
    `/disruptions/${q(disruptionId)}/notify`,
    { method: "POST" },
  );

export const resolveOffer = (
  offerId: string,
  choice: OfferChoice,
  standInStylistId?: string,
) =>
  baseFetch<DisruptionOfferView>(`/disruption-offers/${q(offerId)}/resolve`, {
    method: "POST",
    body: { choice, standInStylistId },
  });

// ── booking requests from the customer app ─────────────────────────────────
export const listBookingRequests = (
  branchId: string,
  status?: "requested" | "confirmed" | "declined",
) =>
  baseFetch<BookingRequestView[]>(
    `/booking-requests?branchId=${q(branchId)}${status ? `&status=${status}` : ""}`,
  );

export const confirmBookingRequest = (id: string) =>
  baseFetch<{ request: BookingRequestView; appointment: AppointmentView }>(
    `/booking-requests/${q(id)}/confirm`,
    { method: "POST" },
  );

export const declineBookingRequest = (id: string) =>
  baseFetch<BookingRequestView>(`/booking-requests/${q(id)}/decline`, { method: "POST" });
