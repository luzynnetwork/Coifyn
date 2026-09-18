"use client";

import { useQuery } from "@tanstack/react-query";
import { getQueueWaitEstimate } from "../../../lib/api/queue/get-queue-wait-estimate";

export interface WaitEstimateProps {
  entryId: string;
}

export function WaitEstimate({ entryId }: WaitEstimateProps) {
  const estimateQuery = useQuery({
    queryKey: ["queue-wait-estimate", entryId],
    queryFn: () => getQueueWaitEstimate(entryId),
  });

  if (!estimateQuery.data) return null;

  return (
    <span className="text-xs text-[var(--color-muted-foreground)]">
      {estimateQuery.data.aheadCount} ahead · ~{estimateQuery.data.estimatedMinutes} min wait
    </span>
  );
}
