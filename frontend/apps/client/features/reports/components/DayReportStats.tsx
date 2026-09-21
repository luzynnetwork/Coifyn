"use client";

import type { DayReportView } from "@coifyn/api-client";
import { formatMoney } from "@coifyn/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@coifyn/ui";

export interface DayReportStatsProps {
  report: DayReportView;
}

export function DayReportStats({ report }: DayReportStatsProps) {
  const stats: Array<{ label: string; value: string }> = [
    { label: "Gross", value: formatMoney(report.grossMinor) },
    { label: "Net (excl. tax)", value: formatMoney(report.netMinor) },
    { label: "Tax", value: formatMoney(report.taxMinor) },
    { label: "Discounts", value: formatMoney(report.discountsMinor) },
    {
      label: `Voids (${report.voids.count})`,
      value: formatMoney(report.voids.totalMinor),
    },
    {
      label: `Refunds (${report.refunds.count})`,
      value: formatMoney(report.refunds.amountMinor),
    },
    { label: "Tickets", value: String(report.ticketCount) },
    { label: "Average ticket", value: formatMoney(report.averageTicketMinor) },
    { label: "Walk-ins", value: String(report.walkIns) },
    { label: "Appointments", value: String(report.appointments) },
    { label: "Cash", value: formatMoney(report.paymentsByMethod.cash) },
    { label: "Card", value: formatMoney(report.paymentsByMethod.card) },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-normal text-[var(--color-muted-foreground)]">
              {stat.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-semibold">{stat.value}</CardContent>
        </Card>
      ))}
    </div>
  );
}
