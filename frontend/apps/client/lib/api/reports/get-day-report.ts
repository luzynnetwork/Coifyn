import { getDayReport as apiGetDayReport, type DayReportView } from "@coifyn/api-client";

/** Thin wrapper around the shared "day report" call. */
export function getDayReport(branchId: string, date: string): Promise<DayReportView> {
  return apiGetDayReport(branchId, date);
}
