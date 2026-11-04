/** Wire types for backend/src/availability. Timestamps are ISO strings (UTC). */

export interface ShiftView {
  id: string;
  stylistId: string;
  branchId: string;
  startAt: string;
  endAt: string;
  chairId: string | null;
  kind: "regular" | "override";
  templateId: string | null;
}

export type TimeOffStatus = "requested" | "approved" | "denied";

export interface TimeOffView {
  id: string;
  stylistId: string;
  branchId: string;
  fromAt: string;
  toAt: string;
  reason: string | null;
  status: TimeOffStatus;
}

export interface RosterView {
  shifts: ShiftView[];
  timeOff: TimeOffView[];
}

export interface PatternEntry {
  /** 0 = Sunday … 6 = Saturday. */
  weekday: number;
  /** Salon-local "HH:MM". */
  start: string;
  end: string;
}

export interface ShiftTemplateView {
  id: string;
  stylistId: string;
  branchId: string;
  name: string;
  chairId: string | null;
  pattern: PatternEntry[];
}

export interface CreateShiftInput {
  stylistId: string;
  startAt: string;
  endAt: string;
  chairId?: string;
}

export interface CreateShiftTemplateInput {
  stylistId: string;
  name: string;
  chairId?: string;
  pattern: PatternEntry[];
}

export interface RequestTimeOffInput {
  stylistId: string;
  fromAt: string;
  toAt: string;
  reason?: string;
}

export interface SlotView {
  startAt: string;
  endAt: string;
}
