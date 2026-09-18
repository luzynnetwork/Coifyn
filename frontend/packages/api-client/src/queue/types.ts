/** Queue wire types — documented contract, see phases/phase-1-salon-core.md. */

export type QueueEntryStatus = "waiting" | "assigned" | "in_service" | "done" | "left";

export interface QueueEntryView {
  id: string;
  branchId: string;
  customerRef: string | null;
  walkInName: string | null;
  requestedStylistId: string | null;
  requestedServiceIds: string[];
  status: QueueEntryStatus;
  joinedAt: string;
  assignedStylistId: string | null;
  assignedChairId: string | null;
  calledAt: string | null;
  position: number;
}

export interface JoinQueueInput {
  branchId: string;
  walkInName?: string;
  customerRef?: string;
  requestedServiceIds: string[];
  requestedStylistId?: string;
}

export interface AssignQueueInput {
  stylistId: string;
  chairId: string;
}

export interface RemoveQueueInput {
  reason: string;
}

export interface WaitEstimateView {
  aheadCount: number;
  estimatedMinutes: number;
}
