"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addCustomerNote, addCustomerTag, type TimelineItem } from "@coifyn/api-client";
import { Badge, Button, Input } from "@coifyn/ui";

const KIND_LABEL: Record<TimelineItem["kind"], string> = {
  visit: "Visit",
  appointment: "Appointment",
  no_show: "No-show",
  cut_record: "Cut",
  note: "Note",
};

export function Timeline({ customerId, items }: { customerId: string; items: TimelineItem[] }) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [tag, setTag] = useState("");
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["timeline", customerId] });

  const addNote = useMutation({
    mutationFn: () => addCustomerNote(customerId, note),
    onSuccess: () => {
      setNote("");
      return refresh();
    },
  });
  const addTag = useMutation({
    mutationFn: () => addCustomerTag(customerId, tag),
    onSuccess: () => {
      setTag("");
      return refresh();
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Input className="w-64" placeholder="Add a private note" value={note} onChange={(e) => setNote(e.target.value)} />
        <Button disabled={!note.trim() || addNote.isPending} onClick={() => addNote.mutate()}>
          Add note
        </Button>
        <Input className="w-40" placeholder="Add a tag" value={tag} onChange={(e) => setTag(e.target.value)} />
        <Button variant="outline" disabled={!tag.trim() || addTag.isPending} onClick={() => addTag.mutate()}>
          Add tag
        </Button>
      </div>
      <ol className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={`${item.kind}-${item.refId}`} className="flex items-start gap-3 rounded-md border border-[var(--color-border)] p-2 text-sm">
            <Badge variant="secondary">{KIND_LABEL[item.kind]}</Badge>
            <div>
              <p>{item.summary}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                {new Date(item.at).toLocaleString()}
              </p>
            </div>
          </li>
        ))}
        {items.length === 0 ? <p className="text-sm">Nothing yet.</p> : null}
      </ol>
    </div>
  );
}
