"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteShift, type ShiftView, type TimeOffView } from "@coifyn/api-client";
import { Badge, Button } from "@coifyn/ui";
import { formatTime, isOnDay } from "../../../shared/lib/dates";
import { ShiftDialog } from "./ShiftDialog";

export interface RosterCellProps {
  date: string;
  stylistId: string;
  shifts: ShiftView[];
  timeOff: TimeOffView[];
  queryKey: unknown[];
}

/** One stylist-day: the shifts on it, any approved time off, and an add button. */
export function RosterCell({ date, stylistId, shifts, timeOff, queryKey }: RosterCellProps) {
  const queryClient = useQueryClient();
  const remove = useMutation({
    mutationFn: (id: string) => deleteShift(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const todays = shifts.filter((s) => isOnDay(s.startAt, date));
  const off = timeOff.filter((t) => new Date(t.fromAt) <= new Date(`${date}T23:59:59`) && new Date(t.toAt) >= new Date(`${date}T00:00:00`));

  return (
    <td className="p-2">
      <div className="flex flex-col gap-1">
        {todays.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-1 rounded bg-[var(--color-muted)] px-1.5 py-1 text-xs">
            <span>
              {formatTime(s.startAt)}–{formatTime(s.endAt)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Remove shift"
              onClick={() => remove.mutate(s.id)}
            >
              ×
            </Button>
          </div>
        ))}
        {off.map((t) => (
          <Badge key={t.id} variant="secondary">
            Off
          </Badge>
        ))}
        <ShiftDialog stylistId={stylistId} date={date} queryKey={queryKey} />
      </div>
    </td>
  );
}
