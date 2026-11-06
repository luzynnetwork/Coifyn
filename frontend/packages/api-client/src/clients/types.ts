/** Wire types for customer CRM, cut records, loyalty and the dashboard. */

export interface TimelineItem {
  kind: "visit" | "appointment" | "no_show" | "cut_record" | "note";
  at: string;
  refId: string;
  summary: string;
  detail?: Record<string, unknown>;
}

export interface TimelineView {
  customer: { id: string; name: string; phone: string; email: string | null };
  tags: string[];
  items: TimelineItem[];
}

export interface PreferencesView {
  customerId?: string;
  preferredStylistId: string | null;
  preferredChairId: string | null;
  drink: string | null;
  conversationLevel: string | null;
  communicationChannel: string | null;
}

export interface ConsentView {
  channel: string;
  purpose: "transactional" | "marketing";
  status: "granted" | "revoked";
}

export interface CutRecordPhoto {
  id: string;
  angle: "front" | "left" | "right" | "back";
  isVerified: boolean;
  url: string | null;
}

export interface CutRecordView {
  id: string;
  customerId: string;
  appointmentId: string | null;
  stylistId: string;
  serviceIds: string[];
  clipperGuards: Record<string, unknown>;
  fadeType: string | null;
  partingNotes: string | null;
  beardNotes: string | null;
  productsUsed: string[];
  freeText: string | null;
  createdAt: string;
  photos?: CutRecordPhoto[];
}

export interface CreateCutRecordInput {
  customerId: string;
  appointmentId?: string;
  ticketId?: string;
  clipperGuards?: Record<string, unknown>;
  fadeType?: string;
  partingNotes?: string;
  beardNotes?: string;
  productsUsed?: string[];
  freeText?: string;
}

export interface FormulaView {
  id: string;
  customerId: string;
  kind: "color" | "perm" | "treatment";
  formula: string;
  developer: string | null;
  processingMin: number | null;
  notes: string | null;
  createdAt: string;
}

export interface LoyaltyView {
  customerId: string;
  pointsBalance: number;
  tier: string | null;
  rule: { pointsPerUnit: number; tiers: { name: string; minPoints: number }[]; expiryDays: number | null };
}

export interface LedgerEntry {
  id: string;
  kind: "earn" | "redeem" | "adjust" | "expire";
  delta: number;
  source: string;
  reason: string | null;
  createdAt: string;
}

export interface Kpi {
  key: string;
  label: string;
  definition: string;
  source: string;
  value: number | null;
  comparison: { value: number | null; changePct: number | null } | null;
  refreshedAt: string;
}

export interface DashboardView {
  branchId: string;
  range: "today" | "week" | "month";
  refreshedAt: string;
  kpis: Kpi[];
  stylists: {
    id: string;
    displayName: string;
    status: string;
    bookedMinutes: number;
    rosteredMinutes: number;
    utilization: number | null;
  }[];
  lowCoverGapMinutes: number;
  unresolvedDisruptions: number;
}
