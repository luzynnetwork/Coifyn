"use client";

import { useEffect, useRef } from "react";

export interface UseTopicStreamOptions {
  /** Realtime topic, e.g. `front-desk:<branchId>` or `disruptions:<branchId>`. */
  topic: string;
  /** Called on every SSE message; callers typically invalidateQueries. */
  onEvent: () => void;
  enabled?: boolean;
}

const RECONNECT_DELAY_MS = 3_000;

/**
 * Subscribes to any topic on GET /realtime/stream and calls `onEvent` for each
 * message — the "SSE just triggers a refetch" pattern used by use-queue-stream,
 * generalised to the Phase 2 topics (`front-desk`, `disruptions`,
 * `stylist-status`, `bookings`). Goes through this app's /api proxy, which adds
 * the bearer token from the httpOnly cookie, and reconnects on a fixed delay.
 */
export function useTopicStream({ topic, onEvent, enabled = true }: UseTopicStreamOptions) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled || !topic) return;
    const controller = new AbortController();

    async function run() {
      while (!controller.signal.aborted) {
        try {
          const response = await fetch(
            `/api/v1/realtime/stream?topic=${encodeURIComponent(topic)}`,
            { signal: controller.signal, headers: { Accept: "text/event-stream" } },
          );
          if (response.status === 401) {
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
  }, [topic, enabled]);
}
