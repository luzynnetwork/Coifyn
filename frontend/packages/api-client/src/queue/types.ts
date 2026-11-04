/**
 * Queue wire types, mirrored from the `queue_entry` drizzle table,
 * backend/src/queue/dto/queue.dto.ts and the use cases in backend/src/queue/application.
 */

export type QueueEntryStatus = "waiting" | "assigned" | "in_service" | "done" | "left";

/** `queue_entry` row (returned by join and every transition). */
export interface QueueEntryRow {
  id: string;
  salonId: string;
  branchId: string;
  customerId: string | null;
  walkInName: string | null;
  requestedStylistId: string | null;
  requestedServiceIds: string[];
  status: QueueEntryStatus;
  joinedAt: string;
  assignedStylistId: string | null;
  assignedChairId: string | null;
  calledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  leftReason: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/** GET /queue row: the entry plus its derived position (1-based among `waiting`, else null). */
export interface QueueEntryView extends QueueEntryRow {
  position: number | null;
}

export interface JoinQueueInput {
  branchId: string;
  /** Provide customerId or walkInName (400 if neither). */
  customerId?: string;
  /** 1-120 chars. */
  walkInName?: string;
  requestedStylistId?: string;
  /** At most 20 service ids; may be empty. */
  requestedServiceIds: string[];
}

export interface AssignQueueInput {
  stylistId: string;
  chairId: string;
}

export interface RemoveQueueInput {
  /** Mandatory, 1-200 chars. */
  reason: string;
}

/** GET /queue/:id/wait-estimate */
export interface WaitEstimateView {
  /** People waiting ahead of this entry. */
  ahead: number;
  minutes: number;
}
