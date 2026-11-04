"use client";

import { Button, Input } from "@coifyn/ui";
import { addDays } from "../lib/dates";

export interface DateNavProps {
  date: string;
  onChange: (date: string) => void;
  /** Days moved by the arrows (7 for week views). */
  step?: number;
}

export function DateNav({ date, onChange, step = 1 }: DateNavProps) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => onChange(addDays(date, -step))}>
        ‹
      </Button>
      <Input
        type="date"
        value={date}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className="w-40"
      />
      <Button variant="outline" size="sm" onClick={() => onChange(addDays(date, step))}>
        ›
      </Button>
    </div>
  );
}
