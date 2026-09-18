"use client";

import type { ServiceAddOnView } from "@coifyn/api-client";
import { formatMoney } from "@coifyn/shared";
import { TableCell, TableRow } from "@coifyn/ui";

export interface AddOnRowProps {
  addOn: ServiceAddOnView;
}

export function AddOnRow({ addOn }: AddOnRowProps) {
  return (
    <TableRow>
      <TableCell>{addOn.name}</TableCell>
      <TableCell>{formatMoney(addOn.priceMinor)}</TableCell>
      <TableCell>{addOn.durationMin} min</TableCell>
    </TableRow>
  );
}
