"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { QueueEntryView } from "@coifyn/api-client";
import { Button, Card, CardContent } from "@coifyn/ui";
import { startQueue } from "../../../lib/api/queue/start-queue";
import { completeQueue } from "../../../lib/api/queue/complete-queue";
import { removeQueue } from "../../../lib/api/queue/remove-queue";
import { WaitEstimate } from "./WaitEstimate";
import { AssignDialog } from "./AssignDialog";

export interface QueueEntryCardProps {
  entry: QueueEntryView;
}

export function QueueEntryCard({ entry }: QueueEntryCardProps) {
  const queryClient = useQueryClient();

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["queue", entry.branchId] });
  }

  const start = useMutation({ mutationFn: () => startQueue(entry.id), onSuccess: invalidate });
  const complete = useMutation({
    mutationFn: () => completeQueue(entry.id),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: () => removeQueue(entry.id, { reason: "Left" }),
    onSuccess: invalidate,
  });

  return (
    <Card>
      <CardContent className="flex flex-col gap-2 pt-4">
        <span className="font-medium">{entry.walkInName ?? "Customer"}</span>
        <span className="text-xs text-[var(--color-muted-foreground)]">
          {entry.requestedServiceIds.length} service(s)
        </span>
        {entry.status === "waiting" ? <WaitEstimate entryId={entry.id} /> : null}

        <div className="flex flex-wrap gap-2">
          {entry.status === "waiting" ? <AssignDialog entry={entry} /> : null}
          {entry.status === "assigned" ? (
            <Button size="sm" disabled={start.isPending} onClick={() => start.mutate()}>
              Start
            </Button>
          ) : null}
          {entry.status === "in_service" ? (
            <Button size="sm" disabled={complete.isPending} onClick={() => complete.mutate()}>
              Complete
            </Button>
          ) : null}
          {entry.status !== "in_service" ? (
            <Button
              size="sm"
              variant="outline"
              disabled={remove.isPending}
              onClick={() => remove.mutate()}
            >
              Remove
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
