"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { switchQueueStylist, type QueueLane } from "@coifyn/api-client";
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@coifyn/ui";

export interface WaitLaneProps {
  lane: QueueLane;
  /** The other lanes — a waiting customer can move to any of them. */
  otherLanes: QueueLane[];
}

/** One stylist's line: who is in the chair, "N ahead, ~M min", and a switch-lane control. */
export function WaitLane({ lane, otherLanes }: WaitLaneProps) {
  const queryClient = useQueryClient();
  const move = useMutation({
    mutationFn: (v: { entryId: string; stylistId: string }) =>
      switchQueueStylist(v.entryId, v.stylistId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["queue-board"] }),
  });

  return (
    <div className="flex min-w-56 flex-1 flex-col gap-2 rounded-md border border-[var(--color-border)] p-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{lane.displayName}</h3>
        <Badge variant="secondary">{lane.status.replace("_", " ")}</Badge>
      </div>
      <p className="text-sm">
        {lane.waitingCount === 0
          ? "No one waiting"
          : `${lane.waitingCount} waiting · ~${lane.estimatedMinutes} min for the next person`}
      </p>
      {lane.inService ? (
        <p className="text-xs text-[var(--color-muted-foreground)]">
          In chair: {lane.inService.walkInName ?? "customer"}
        </p>
      ) : null}
      {lane.waiting.map((e) => (
        <div key={e.id} className="flex items-center justify-between gap-2 rounded border border-[var(--color-border)] p-1.5 text-xs">
          <span>
            {e.walkInName ?? "Customer"} — {e.ahead} ahead, ~{e.minutes} min
          </span>
          {otherLanes.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost">
                  Switch
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {otherLanes.map((o) => (
                  <DropdownMenuItem
                    key={o.stylistId}
                    onClick={() => move.mutate({ entryId: e.id, stylistId: o.stylistId })}
                  >
                    {o.displayName} (~{o.estimatedMinutes} min)
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      ))}
    </div>
  );
}
