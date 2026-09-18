"use client";

import type { ChairView } from "@coifyn/api-client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@coifyn/ui";
import { ChairRow } from "./ChairRow";

export interface ChairListProps {
  branchId: string;
  chairs: ChairView[];
}

export function ChairList({ branchId, chairs }: ChairListProps) {
  if (chairs.length === 0) {
    return <p className="text-sm text-[var(--color-muted-foreground)]">No chairs yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Label</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-24" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {chairs.map((chair) => (
          <ChairRow key={chair.id} branchId={branchId} chair={chair} />
        ))}
      </TableBody>
    </Table>
  );
}
