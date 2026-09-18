import { baseFetch } from "../http/base-fetch";
import type { DayReportView } from "./types";

/** GET /reports/day?branchId&date */
export function getDayReport(branchId: string, date: string): Promise<DayReportView> {
  return baseFetch<DayReportView>(`/reports/day?branchId=${branchId}&date=${date}`);
}
