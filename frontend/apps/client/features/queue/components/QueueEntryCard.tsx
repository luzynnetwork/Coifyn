"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { QueueEntryView } from "@coifyn/api-client";
import { Button, Card, CardContent } from "@coifyn/ui";
import { startQueue } from "../../../lib/api/queue/start-queue";
import { completeQueue } from "../../../lib/api/queue/complete-queue";
import { removeQueue } from "../../../lib/api/queue/remove-queue";
import { ReasonDialog } from "../../../shared/components/ReasonDialog";
import { WaitEstimate } from "./WaitEstimate";
import { AssignDialog } from "./AssignDialog";
import { ChargeQueueButton } from "./ChargeQueueButton";

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
    mutationFn: (reason: string) => removeQueue(entry.id, { reason }),
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
          {entry.status === "assigned" || entry.status === "in_service" ? (
            <ChargeQueueButton entry={entry} />
          ) : null}
          {entry.status !== "in_service" ? (
            <ReasonDialog
              title="Remove from queue"
              description="Why is this person leaving the queue?"
              confirmLabel="Remove"
              isPending={remove.isPending}
              onConfirm={(reason) => remove.mutate(reason)}
              trigger={
                <Button size="sm" variant="outline">
                  Remove
                </Button>
              }
            />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
