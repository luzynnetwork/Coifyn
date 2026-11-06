import { baseFetch } from "../http/base-fetch";
import type { RegisterSessionReportView } from "./types";

/** GET /reports/register-session/:id */
export function getRegisterSessionReport(id: string): Promise<RegisterSessionReportView> {
  return baseFetch<RegisterSessionReportView>(`/reports/register-session/${id}`);
}
