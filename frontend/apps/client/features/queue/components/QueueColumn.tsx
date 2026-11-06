"use client";

import type { QueueEntryView } from "@coifyn/api-client";
import { QueueEntryCard } from "./QueueEntryCard";

export interface QueueColumnProps {
  title: string;
  entries: QueueEntryView[];
}

export function QueueColumn({ title, entries }: QueueColumnProps) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-[var(--color-border)] p-3">
      <h2 className="text-sm font-medium text-[var(--color-muted-foreground)]">
        {title} ({entries.length})
      </h2>
      <div className="flex flex-col gap-2">
        {entries.map((entry) => (
          <QueueEntryCard key={entry.id} entry={entry} />
        ))}
        {entries.length === 0 ? (
          <p className="text-xs text-[var(--color-muted-foreground)]">Nothing here.</p>
        ) : null}
      </div>
    </div>
  );
}
