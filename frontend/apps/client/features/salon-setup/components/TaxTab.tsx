"use client";

import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@coifyn/ui";
import { listTaxRates } from "../../../lib/api/tax-rates/list-tax-rates";
import { TaxRateRow } from "./TaxRateRow";
import { TaxRateDialog } from "./TaxRateDialog";

export function TaxTab() {
  const taxRatesQuery = useQuery({ queryKey: ["tax-rates"], queryFn: listTaxRates });
  const taxRates = taxRatesQuery.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <TaxRateDialog mode="create" />
      </div>
      {taxRates.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">No tax rates yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Inclusive</TableHead>
              <TableHead>Default</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {taxRates.map((rate) => (
              <TaxRateRow key={rate.id} taxRate={rate} />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
