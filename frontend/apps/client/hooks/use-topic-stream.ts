"use client";

import { useEffect, useRef } from "react";

export interface UseTopicStreamOptions {
  /** Realtime topic, e.g. `queue:<branchId>` or `front-desk:<branchId>`. */
  topic: string;
  /** Called on every SSE message; callers typically invalidateQueries. */
  onEvent: () => void;
  enabled?: boolean;
}

const RECONNECT_DELAY_MS = 3_000;

interface SharedStream {
  listeners: Set<() => void>;
  controller: AbortController;
}

/** One open stream per topic per page, however many components listen. Two
 *  identical GETs would otherwise each need a connection, and Chrome holds the
 *  second one behind the first (its HTTP cache lock) until it times out, so
 *  that listener silently misses events. */
const streams = new Map<string, SharedStream>();

function openStream(topic: string, shared: SharedStream) {
  const { controller, listeners } = shared;

  async function run() {
    while (!controller.signal.aborted) {
      try {
        const response = await fetch(
          `/api/v1/realtime/stream?topic=${encodeURIComponent(topic)}`,
          {
            signal: controller.signal,
            headers: { Accept: "text/event-stream" },
            // Bypass the HTTP cache entirely, so no cache lock applies.
            cache: "no-store",
          },
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
            for (const listener of [...listeners]) listener();
          }
        }
      } catch {
        if (controller.signal.aborted) return;
      }
      // The server closes a stream after 5 minutes; reconnect on a fixed delay.
      await new Promise((resolve) => setTimeout(resolve, RECONNECT_DELAY_MS));
    }
  }

  void run();
}

function subscribe(topic: string, listener: () => void): () => void {
  let shared = streams.get(topic);
  if (!shared) {
    shared = { listeners: new Set(), controller: new AbortController() };
    streams.set(topic, shared);
    openStream(topic, shared);
  }
  shared.listeners.add(listener);

  const current = shared;
  return () => {
    current.listeners.delete(listener);
    if (current.listeners.size === 0) {
      current.controller.abort();
      if (streams.get(topic) === current) streams.delete(topic);
    }
  };
}

/**
 * Subscribes to a topic on GET /realtime/stream and calls `onEvent` for each
 * message (the "SSE just triggers a refetch" pattern). Goes through this app's
 * /api proxy, which adds the bearer token from the httpOnly session cookie, so
 * nothing token-shaped is handled here. Read with fetch rather than
 * EventSource so a dropped stream reconnects on a delay we control.
 */
export function useTopicStream({ topic, onEvent, enabled = true }: UseTopicStreamOptions) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled || !topic) return;
    return subscribe(topic, () => onEventRef.current());
  }, [topic, enabled]);
}
