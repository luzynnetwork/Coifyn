/** Wire types for the Phase 2 appointment, queue-board and disruption endpoints. */
import type { AppointmentView } from "../appointments/types";

export interface BoardAppointment extends AppointmentView {
  customerName: string | null;
}

export interface FrontDeskStylist {
  id: string;
  displayName: string;
  status: string;
  upcoming: BoardAppointment[];
  arrived: BoardAppointment[];
  inService: BoardAppointment[];
  done: BoardAppointment[];
}

export interface FrontDeskBoardView {
  date: string;
  stylists: FrontDeskStylist[];
}

export interface DaySheetItem extends AppointmentView {
  customer: { id: string; name: string; phone: string } | null;
}

export interface DaySheetView {
  stylist: { id: string; displayName: string };
  items: DaySheetItem[];
}

export interface RescheduleInput {
  startAt: string;
  endAt: string;
  reason?: string;
  overrideReason?: string;
}

// ── queue board ────────────────────────────────────────────────────────────
export interface QueueLaneEntry {
  id: string;
  walkInName: string | null;
  status: string;
  joinedAt: string;
  /** People ahead in this stylist's line. */
  ahead: number;
  /** Estimated wait for this entry. */
  minutes: number;
}

export interface QueueLane {
  stylistId: string;
  displayName: string;
  status: string;
  inService: { id: string; walkInName: string | null; startedAt: string | null } | null;
  nextUp: { id: string; walkInName: string | null } | null;
  waitingCount: number;
  /** What a new joiner on this lane would wait. */
  estimatedMinutes: number;
  waiting: QueueLaneEntry[];
}

export interface QueueBoardView {
  branchId: string;
  at: string;
  lanes: QueueLane[];
  unassigned: { id: string; walkInName: string | null }[];
}

// ── disruptions ────────────────────────────────────────────────────────────
export type DisruptionKind = "running_late" | "absent" | "left_early";
export type OfferChoice = "wait" | "next_slot" | "stand_in" | "cancel";

export interface OfferOption {
  choice: OfferChoice;
  stylistIds?: string[];
}

export interface DisruptionOfferView {
  id: string;
  disruptionId: string;
  appointmentId: string;
  branchId: string;
  options: OfferOption[];
  choice: OfferChoice | "pending";
  standInStylistId: string | null;
  sentAt: string;
  resolvedAt: string | null;
  escalatedAt: string | null;
}

export interface DisruptionView {
  id: string;
  branchId: string;
  stylistId: string;
  kind: DisruptionKind;
  minutesLate: number | null;
  windowStart: string;
  windowEnd: string;
  status: "open" | "resolved";
  notifiedAt: string | null;
  offers?: DisruptionOfferView[];
}

export interface AffectedAppointment extends AppointmentView {
  customer: { id: string; name: string; phone: string } | null;
}

// ── booking requests ───────────────────────────────────────────────────────
export interface BookingRequestView {
  id: string;
  branchId: string;
  stylistId: string;
  serviceIds: string[];
  startAt: string;
  endAt: string;
  customerName: string;
  customerPhone: string;
  notes: string | null;
  status: "requested" | "confirmed" | "declined";
  appointmentId: string | null;
}
