"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getQueueBoard } from "@coifyn/api-client";
import { useQueueStream } from "../../../hooks/use-queue-stream";
import { WaitLane } from "./WaitLane";

/** Per-stylist wait lanes above the status columns; refetches with the queue stream. */
export function WaitLanes({ branchId }: { branchId: string }) {
  const queryClient = useQueryClient();
  const board = useQuery({
    queryKey: ["queue-board", branchId],
    queryFn: () => getQueueBoard(branchId),
    enabled: Boolean(branchId),
    // Elapsed service time moves the estimate even without a queue event.
    refetchInterval: 60_000,
  });
  useQueueStream({
    branchId,
    enabled: Boolean(branchId),
    onEvent: () => queryClient.invalidateQueries({ queryKey: ["queue-board", branchId] }),
  });

  const lanes = board.data?.lanes ?? [];
  if (lanes.length === 0) return null;
  return (
    <div className="flex gap-4 overflow-x-auto">
      {lanes.map((lane) => (
        <WaitLane
          key={lane.stylistId}
          lane={lane}
          otherLanes={lanes.filter((l) => l.stylistId !== lane.stylistId)}
        />
      ))}
    </div>
  );
}
