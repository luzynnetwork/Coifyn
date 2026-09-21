"use client";

import { useEffect, useRef } from "react";

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
 * The stream goes through this app's own /api proxy, which adds the bearer
 * token from the httpOnly session cookie, so nothing token-shaped is handled
 * here. The response is read with fetch rather than EventSource so a dropped
 * or closed stream (the server closes one after 5 minutes) reconnects on a
 * fixed delay we control.
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
          const response = await fetch(
            `/api/v1/realtime/stream?topic=${encodeURIComponent(`queue:${branchId}`)}`,
            { signal: controller.signal, headers: { Accept: "text/event-stream" } },
          );
          if (response.status === 401) {
            // The proxy already tried to refresh; the session is over.
            window.location.href = "/login";
            return;
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
