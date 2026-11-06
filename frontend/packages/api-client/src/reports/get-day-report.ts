import { baseFetch } from "../http/base-fetch";
import type { DayReportView } from "./types";

/** GET /reports/day?branchId&date (date is YYYY-MM-DD in the salon timezone). */
export function getDayReport(branchId: string, date: string): Promise<DayReportView> {
  const params = new URLSearchParams({ branchId, date });
  return baseFetch<DayReportView>(`/reports/day?${params.toString()}`);
}
