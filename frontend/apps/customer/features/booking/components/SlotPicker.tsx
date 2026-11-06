"use client";

import type { PublicSlot } from "@coifyn/api-client";
import { Button, Label } from "@coifyn/ui";

export interface SlotPickerProps {
  slots: PublicSlot[];
  loading: boolean;
  /** Stylist and service are chosen, so slots can be shown. */
  ready: boolean;
  timeZone?: string;
  value: string;
  onChange: (startAt: string) => void;
}

export function SlotPicker({ slots, loading, ready, timeZone, value, onChange }: SlotPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label>Open times</Label>
      {!ready ? <p className="text-sm text-[var(--color-muted-foreground)]">Choose a stylist and service first.</p> : null}
      {ready && !loading && slots.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">No open times that day — try another day.</p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {slots.map((s) => (
          <Button
            key={s.startAt}
            size="sm"
            variant={s.startAt === value ? "default" : "outline"}
            onClick={() => onChange(s.startAt)}
          >
            {new Date(s.startAt).toLocaleTimeString([], { timeZone, hour: "2-digit", minute: "2-digit" })}
          </Button>
        ))}
      </div>
    </div>
  );
}
