import { baseFetch } from "../http/base-fetch";
import type {
  CreateShiftInput,
  CreateShiftTemplateInput,
  RequestTimeOffInput,
  RosterView,
  ShiftTemplateView,
  ShiftView,
  SlotView,
  TimeOffStatus,
  TimeOffView,
} from "./types";

const q = encodeURIComponent;

/** GET /availability/roster — shifts and approved time off between two local dates. */
export const getRoster = (branchId: string, from: string, to: string) =>
  baseFetch<RosterView>(`/availability/roster?branchId=${q(branchId)}&from=${from}&to=${to}`);

export const createShift = (input: CreateShiftInput) =>
  baseFetch<ShiftView>("/shifts", { method: "POST", body: input });

export const deleteShift = (id: string) =>
  baseFetch<{ deleted: true }>(`/shifts/${q(id)}`, { method: "DELETE" });

export const listShiftTemplates = () => baseFetch<ShiftTemplateView[]>("/shift-templates");

export const createShiftTemplate = (input: CreateShiftTemplateInput) =>
  baseFetch<ShiftTemplateView>("/shift-templates", { method: "POST", body: input });

/** Idempotent: re-applying a range creates nothing new. */
export const applyShiftTemplate = (id: string, range: { from: string; to: string }) =>
  baseFetch<{ created: number }>(`/shift-templates/${q(id)}/apply`, {
    method: "POST",
    body: range,
  });

export const listTimeOff = (branchId?: string, status?: TimeOffStatus) => {
  const params = new URLSearchParams();
  if (branchId) params.set("branchId", branchId);
  if (status) params.set("status", status);
  return baseFetch<TimeOffView[]>(`/time-off?${params.toString()}`);
};

export const requestTimeOff = (input: RequestTimeOffInput) =>
  baseFetch<TimeOffView>("/time-off", { method: "POST", body: input });

/** Approving returns the bookings already inside the span so the desk can act. */
export const decideTimeOff = (id: string, decision: "approve" | "deny") =>
  baseFetch<{ timeOff: TimeOffView; affectedAppointments: unknown[] }>(
    `/time-off/${q(id)}/${decision}`,
    { method: "POST" },
  );

export const getSlots = (stylistId: string, serviceIds: string[], date: string) =>
  baseFetch<SlotView[]>(
    `/availability/slots?stylistId=${q(stylistId)}&serviceIds=${serviceIds.map(q).join(",")}&date=${date}`,
  );
