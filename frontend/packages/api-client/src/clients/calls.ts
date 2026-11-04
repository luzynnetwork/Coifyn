import { baseFetch } from "../http/base-fetch";
import type {
  ConsentView,
  CreateCutRecordInput,
  CutRecordView,
  DashboardView,
  FormulaView,
  LedgerEntry,
  LoyaltyView,
  PreferencesView,
  TimelineView,
} from "./types";

const q = encodeURIComponent;

// ── customer profile ───────────────────────────────────────────────────────
export const getTimeline = (customerId: string) =>
  baseFetch<TimelineView>(`/customers/${q(customerId)}/timeline`);

export const getPreferences = (customerId: string) =>
  baseFetch<PreferencesView>(`/customers/${q(customerId)}/preferences`);

export const updatePreferences = (customerId: string, input: Partial<PreferencesView>) =>
  baseFetch<PreferencesView>(`/customers/${q(customerId)}/preferences`, {
    method: "PATCH",
    body: input,
  });

export const getConsent = (customerId: string) =>
  baseFetch<ConsentView[]>(`/customers/${q(customerId)}/consent`);

export const updateConsent = (customerId: string, input: ConsentView) =>
  baseFetch<ConsentView>(`/customers/${q(customerId)}/consent`, {
    method: "PATCH",
    body: input,
  });

export const addCustomerTag = (customerId: string, tag: string) =>
  baseFetch<unknown>(`/customers/${q(customerId)}/tags`, { method: "POST", body: { tag } });

export const addCustomerNote = (customerId: string, body: string) =>
  baseFetch<unknown>(`/customers/${q(customerId)}/notes`, { method: "POST", body: { body } });

// ── cut records ────────────────────────────────────────────────────────────
export const listCutRecords = (customerId: string) =>
  baseFetch<CutRecordView[]>(`/customers/${q(customerId)}/cut-records`);

export const createCutRecord = (input: CreateCutRecordInput) =>
  baseFetch<CutRecordView>("/cut-records", { method: "POST", body: input });

/** The customer's most recent cut for whoever serves this appointment next. */
export const getLastCut = (appointmentId: string) =>
  baseFetch<{ lastCut: CutRecordView | null }>(`/appointments/${q(appointmentId)}/last-cut`);

export const addCutRecordPhoto = (
  cutRecordId: string,
  angle: "front" | "left" | "right" | "back",
  contentType: "image/jpeg" | "image/png" | "image/webp",
) =>
  baseFetch<{ photo: { id: string }; uploadUrl: string }>(
    `/cut-records/${q(cutRecordId)}/photos`,
    { method: "POST", body: { angle, contentType } },
  );

export const listFormulas = (customerId: string) =>
  baseFetch<FormulaView[]>(`/customers/${q(customerId)}/formulas`);

export const createFormula = (input: {
  customerId: string;
  kind: "color" | "perm" | "treatment";
  formula: string;
  developer?: string;
  processingMin?: number;
  notes?: string;
}) => baseFetch<FormulaView>("/formulas", { method: "POST", body: input });

// ── loyalty ────────────────────────────────────────────────────────────────
export const getLoyalty = (customerId: string) =>
  baseFetch<LoyaltyView>(`/customers/${q(customerId)}/loyalty`);

export const getLoyaltyLedger = (customerId: string) =>
  baseFetch<LedgerEntry[]>(`/customers/${q(customerId)}/loyalty/ledger`);

export const adjustLoyalty = (customerId: string, delta: number, reason: string) =>
  baseFetch<unknown>(`/customers/${q(customerId)}/loyalty/adjust`, {
    method: "POST",
    body: { delta, reason },
  });

// ── dashboard ──────────────────────────────────────────────────────────────
export const getDashboard = (
  branchId: string,
  range: "today" | "week" | "month" = "today",
  compare = true,
) =>
  baseFetch<DashboardView>(
    `/dashboard?branchId=${q(branchId)}&range=${range}&compare=${compare}`,
  );
