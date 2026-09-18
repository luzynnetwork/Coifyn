/** Report wire types — documented contract, see phases/phase-1-salon-core.md. */

export interface DayReportView {
  branchId: string;
  date: string;
  grossMinor: number;
  netMinor: number;
  taxMinor: number;
  discountMinor: number;
  voidMinor: number;
  refundMinor: number;
  ticketCount: number;
  averageTicketMinor: number;
  walkInCount: number;
  appointmentCount: number;
}

export interface SalesByServiceRow {
  serviceId: string;
  serviceName: string;
  revenueMinor: number;
  count: number;
}

export interface SalesByStylistRow {
  stylistId: string;
  stylistName: string;
  revenueMinor: number;
  ticketCount: number;
  serviceCount: number;
}

export interface RegisterSessionReportView {
  sessionId: string;
  openingFloatMinor: number;
  expectedMinor: number;
  countedMinor: number;
  varianceMinor: number;
}
