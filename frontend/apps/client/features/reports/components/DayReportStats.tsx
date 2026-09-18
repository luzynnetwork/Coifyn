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
    { label: "Net", value: formatMoney(report.netMinor) },
    { label: "Tax", value: formatMoney(report.taxMinor) },
    { label: "Discounts", value: formatMoney(report.discountMinor) },
    { label: "Voids", value: formatMoney(report.voidMinor) },
    { label: "Refunds", value: formatMoney(report.refundMinor) },
    { label: "Tickets", value: String(report.ticketCount) },
    { label: "Average ticket", value: formatMoney(report.averageTicketMinor) },
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
