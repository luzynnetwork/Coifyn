import {
  getRegisterSessionReport as apiGetRegisterSessionReport,
  type RegisterSessionReportView,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "register session report" call. */
export function getRegisterSessionReport(id: string): Promise<RegisterSessionReportView> {
  return apiGetRegisterSessionReport(id);
}
