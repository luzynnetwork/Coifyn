"use client";

import { useQuery } from "@tanstack/react-query";
import { formatMoney } from "@coifyn/shared";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@coifyn/ui";
import { getSalesByService } from "../../../lib/api/reports/get-sales-by-service";

export interface SalesByServiceProps {
  date: string;
}

export function SalesByService({ date }: SalesByServiceProps) {
  const salesQuery = useQuery({
    queryKey: ["sales-by-service", date],
    queryFn: () => getSalesByService(date, date),
    enabled: Boolean(date),
  });
  const rows = salesQuery.data ?? [];

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-medium text-[var(--color-muted-foreground)]">
        Sales by service
      </h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Service</TableHead>
            <TableHead>Revenue</TableHead>
            <TableHead>Count</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.serviceId}>
              <TableCell>{row.serviceName}</TableCell>
              <TableCell>{formatMoney(row.revenueMinor)}</TableCell>
              <TableCell>{row.count}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
