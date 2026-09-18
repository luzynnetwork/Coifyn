"use client";

import { useQuery } from "@tanstack/react-query";
import { formatMoney } from "@coifyn/shared";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@coifyn/ui";
import { getSalesByStylist } from "../../../lib/api/reports/get-sales-by-stylist";

export interface SalesByStylistProps {
  date: string;
}

export function SalesByStylist({ date }: SalesByStylistProps) {
  const salesQuery = useQuery({
    queryKey: ["sales-by-stylist", date],
    queryFn: () => getSalesByStylist(date, date),
    enabled: Boolean(date),
  });
  const rows = salesQuery.data ?? [];

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-medium text-[var(--color-muted-foreground)]">
        Sales by stylist
      </h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Stylist</TableHead>
            <TableHead>Revenue</TableHead>
            <TableHead>Tickets</TableHead>
            <TableHead>Services</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.stylistId}>
              <TableCell>{row.stylistName}</TableCell>
              <TableCell>{formatMoney(row.revenueMinor)}</TableCell>
              <TableCell>{row.ticketCount}</TableCell>
              <TableCell>{row.serviceCount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
