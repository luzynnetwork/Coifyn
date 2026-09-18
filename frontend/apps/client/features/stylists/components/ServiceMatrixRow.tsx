"use client";

import type { ServiceView, StylistServiceView } from "@coifyn/api-client";
import { dollarsToMinor, minorToDollars } from "@coifyn/shared";
import { Input, TableCell, TableRow } from "@coifyn/ui";

export interface ServiceMatrixRowProps {
  service: ServiceView;
  row: StylistServiceView | null;
  onChange: (patch: Partial<StylistServiceView>) => void;
}

export function ServiceMatrixRow({ service, row, onChange }: ServiceMatrixRowProps) {
  const canPerform = row?.canPerform ?? false;

  return (
    <TableRow>
      <TableCell>{service.name}</TableCell>
      <TableCell>
        <input
          type="checkbox"
          checked={canPerform}
          onChange={(event) => onChange({ canPerform: event.target.checked })}
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          step="0.01"
          className="w-28"
          disabled={!canPerform}
          placeholder={minorToDollars(service.basePriceMinor)}
          value={row?.priceOverrideMinor != null ? minorToDollars(row.priceOverrideMinor) : ""}
          onChange={(event) =>
            onChange({
              priceOverrideMinor: event.target.value ? dollarsToMinor(event.target.value) : null,
            })
          }
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          className="w-24"
          disabled={!canPerform}
          placeholder={String(service.baseDurationMin)}
          value={row?.durationOverrideMin ?? ""}
          onChange={(event) =>
            onChange({
              durationOverrideMin: event.target.value
                ? Number.parseInt(event.target.value, 10)
                : null,
            })
          }
        />
      </TableCell>
    </TableRow>
  );
}
