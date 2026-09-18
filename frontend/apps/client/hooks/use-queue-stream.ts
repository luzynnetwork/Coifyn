"use client";

import { useEffect, useRef } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

export interface UseQueueStreamOptions {
  branchId: string;
  /** Called on every SSE message for the topic — callers typically invalidateQueries. */
  onEvent: () => void;
  enabled?: boolean;
}

/**
 * Opens one EventSource against the shared realtime stream for the
 * `queue:<branchId>` topic and calls `onEvent` on every message. Mirrors
 * @coifyn/shared's useNotificationStream (architecture.md §10 / §4's
 * "SSE just triggers a refetch" pattern) but for the salon/branch-shared
 * realtime stream rather than the per-user notifications stream.
 */
export function useQueueStream({ branchId, onEvent, enabled = true }: UseQueueStreamOptions) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled || !branchId) return;

    const source = new EventSource(
      `${API_BASE_URL}/realtime/stream?topic=queue:${branchId}`,
      { withCredentials: true },
    );

    const handleMessage = () => onEventRef.current();
    source.addEventListener("message", handleMessage);

    return () => {
      source.removeEventListener("message", handleMessage);
      source.close();
    };
  }, [branchId, enabled]);
}
