"use client";

import { useTopicStream } from "./use-topic-stream";

export interface UseQueueStreamOptions {
  branchId: string;
  /** Called on every SSE message for the topic; callers typically invalidateQueries. */
  onEvent: () => void;
  enabled?: boolean;
}

/** The `queue:<branchId>` topic. Shares one stream with every other listener
 *  on the page (see use-topic-stream). */
export function useQueueStream({ branchId, onEvent, enabled = true }: UseQueueStreamOptions) {
  useTopicStream({ topic: branchId ? `queue:${branchId}` : "", onEvent, enabled });
}
