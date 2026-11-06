"use client";

import type { WeekdayHours } from "@coifyn/api-client";
import { Button, Input, Switch } from "@coifyn/ui";
import { BreakWindowRow } from "./BreakWindowRow";

export interface WeekdayHoursRowProps {
  label: string;
  day: WeekdayHours;
  onChange: (day: WeekdayHours) => void;
}

export function WeekdayHoursRow({ label, day, onChange }: WeekdayHoursRowProps) {
  function addBreak() {
    onChange({ ...day, breaks: [...day.breaks, { start: "12:00", end: "12:30" }] });
  }

  function removeBreak(index: number) {
    onChange({ ...day, breaks: day.breaks.filter((_, i) => i !== index) });
  }

  function updateBreak(index: number, start: string, end: string) {
    onChange({
      ...day,
      breaks: day.breaks.map((b, i) => (i === index ? { start, end } : b)),
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-[var(--color-border)] p-3">
      <div className="flex items-center gap-3">
        <span className="w-10 text-sm font-medium">{label}</span>
        <Switch
          checked={!day.isClosed}
          onCheckedChange={(checked) => onChange({ ...day, isClosed: !checked })}
        />
        <span className="text-sm text-[var(--color-muted-foreground)]">
          {day.isClosed ? "Closed" : "Open"}
        </span>
        {!day.isClosed ? (
          <>
            <Input
              type="time"
              className="w-32"
              value={day.opensAt ?? ""}
              onChange={(event) => onChange({ ...day, opensAt: event.target.value })}
            />
            <span>–</span>
            <Input
              type="time"
              className="w-32"
              value={day.closesAt ?? ""}
              onChange={(event) => onChange({ ...day, closesAt: event.target.value })}
            />
          </>
        ) : null}
      </div>

      {!day.isClosed ? (
        <div className="flex flex-col gap-2 pl-14">
          {day.breaks.map((brk, index) => (
            <BreakWindowRow
              key={index}
              start={brk.start}
              end={brk.end}
              onChange={(start, end) => updateBreak(index, start, end)}
              onRemove={() => removeBreak(index)}
            />
          ))}
          {day.breaks.length < 4 ? (
            <Button type="button" variant="outline" className="w-fit" onClick={addBreak}>
              Add break
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
