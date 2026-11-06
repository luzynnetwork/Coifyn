"use client";

import type { TaxRateView } from "@coifyn/api-client";
import { Badge, TableCell, TableRow } from "@coifyn/ui";
import { TaxRateDialog } from "./TaxRateDialog";

export interface TaxRateRowProps {
  taxRate: TaxRateView;
}

export function TaxRateRow({ taxRate }: TaxRateRowProps) {
  return (
    <TableRow>
      <TableCell>{taxRate.name}</TableCell>
      <TableCell>{(taxRate.percentBasisPoints / 100).toFixed(2)}%</TableCell>
      <TableCell>{taxRate.inclusive ? "Yes" : "No"}</TableCell>
      <TableCell>
        {taxRate.isDefault ? <Badge>Default</Badge> : null}
      </TableCell>
      <TableCell>
        <TaxRateDialog mode="edit" taxRate={taxRate} />
      </TableCell>
    </TableRow>
  );
}
