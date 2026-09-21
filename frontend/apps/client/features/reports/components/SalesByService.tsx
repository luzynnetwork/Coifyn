"use client";

import { useQuery } from "@tanstack/react-query";
import { formatMoney } from "@coifyn/shared";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@coifyn/ui";
import { getSalesByService } from "../../../lib/api/reports/get-sales-by-service";

export interface SalesByServiceProps {
  branchId: string;
  date: string;
}

export function SalesByService({ branchId, date }: SalesByServiceProps) {
  const salesQuery = useQuery({
    queryKey: ["reports", "sales-by-service", branchId, date],
    queryFn: () => getSalesByService(date, date, branchId),
    enabled: Boolean(branchId && date),
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
            <TableHead>Quantity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={`${row.serviceId}-${row.name}`}>
              <TableCell>{row.name}</TableCell>
              <TableCell>{formatMoney(row.revenueMinor)}</TableCell>
              <TableCell>{row.quantity}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
