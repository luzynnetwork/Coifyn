"use client";

import { useQuery } from "@tanstack/react-query";
import { listAffected } from "@coifyn/api-client";
import { formatTime } from "../../../shared/lib/dates";

/** Appointments inside the disruption window, before anyone is notified. */
export function AffectedList({ disruptionId }: { disruptionId: string }) {
  const affected = useQuery({
    queryKey: ["disruption-affected", disruptionId],
    queryFn: () => listAffected(disruptionId),
  });
  const rows = affected.data ?? [];

  return (
    <div className="flex flex-col gap-1 text-sm">
      <h3 className="font-medium">Affected appointments ({rows.length})</h3>
      {rows.map((a) => (
        <p key={a.id}>
          {formatTime(a.startAt)} — {a.customer?.name ?? "No customer on file"}
          {a.customer ? ` · ${a.customer.phone}` : ""}
        </p>
      ))}
      {rows.length === 0 ? (
        <p className="text-[var(--color-muted-foreground)]">No bookings in the window.</p>
      ) : null}
    </div>
  );
}
