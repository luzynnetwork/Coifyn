"use client";

import type { AppointmentView, StylistView } from "@coifyn/api-client";
import { Badge } from "@coifyn/ui";
import { AppointmentCard } from "./AppointmentCard";

export interface StylistColumnProps {
  stylist: StylistView;
  appointments: AppointmentView[];
  stylists: StylistView[];
  customerNames: Map<string, string>;
}

export function StylistColumn({ stylist, appointments, stylists, customerNames }: StylistColumnProps) {
  return (
    <div className="flex min-w-60 flex-1 flex-col gap-2 rounded-md border border-[var(--color-border)] p-3">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">{stylist.displayName}</h2>
        <Badge variant="secondary">{stylist.status.replace("_", " ")}</Badge>
      </div>
      {appointments.map((a) => (
        <AppointmentCard
          key={a.id}
          appointment={a}
          stylists={stylists}
          customerName={a.customerId ? customerNames.get(a.customerId) : null}
        />
      ))}
      {appointments.length === 0 ? (
        <p className="text-xs text-[var(--color-muted-foreground)]">No bookings.</p>
      ) : null}
    </div>
  );
}
