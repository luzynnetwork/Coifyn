"use client";

import { useEffect, useRef } from "react";
import { getApiClientConfig } from "@coifyn/api-client";

export interface UseQueueStreamOptions {
  branchId: string;
  /** Called on every SSE message for the topic; callers typically invalidateQueries. */
  onEvent: () => void;
  enabled?: boolean;
}

const RECONNECT_DELAY_MS = 3_000;

/**
 * Subscribes to the `queue:<branchId>` topic on GET /realtime/stream and calls
 * `onEvent` on every message (the "SSE just triggers a refetch" pattern).
 *
 * The backend guards the stream with a Bearer token, which the browser's
 * EventSource cannot send, so this reads the text/event-stream response with
 * fetch. The server closes a stream after 5 minutes; this reconnects.
 */
export function useQueueStream({ branchId, onEvent, enabled = true }: UseQueueStreamOptions) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled || !branchId) return;
    const controller = new AbortController();

    async function run() {
      while (!controller.signal.aborted) {
        try {
          const config = getApiClientConfig();
          const token = config.getAccessToken();
          const response = await fetch(
            `${config.baseUrl}/realtime/stream?topic=${encodeURIComponent(`queue:${branchId}`)}`,
            {
              signal: controller.signal,
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            },
          );
          if (response.status === 401 && config.refreshAccessToken) {
            await config.refreshAccessToken();
            continue;
          }
          if (!response.ok || !response.body) throw new Error(`stream ${response.status}`);

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            // SSE frames end with a blank line; heartbeats are ": ping" comments.
            const frames = buffer.split("\n\n");
            buffer = frames.pop() ?? "";
            if (frames.some((frame) => frame.split("\n").some((l) => l.startsWith("data:")))) {
              onEventRef.current();
            }
          }
        } catch {
          if (controller.signal.aborted) return;
        }
        await new Promise((resolve) => setTimeout(resolve, RECONNECT_DELAY_MS));
      }
    }

    void run();
    return () => controller.abort();
  }, [branchId, enabled]);
}
