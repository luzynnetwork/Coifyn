"use client";

import { Button, Input } from "@coifyn/ui";

export interface BreakWindowRowProps {
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
  onRemove: () => void;
}

export function BreakWindowRow({ start, end, onChange, onRemove }: BreakWindowRowProps) {
  return (
    <div className="flex items-center gap-2">
      <Input
        type="time"
        className="w-32"
        value={start}
        onChange={(event) => onChange(event.target.value, end)}
      />
      <span>–</span>
      <Input
        type="time"
        className="w-32"
        value={end}
        onChange={(event) => onChange(start, event.target.value)}
      />
      <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
        Remove
      </Button>
    </div>
  );
}
