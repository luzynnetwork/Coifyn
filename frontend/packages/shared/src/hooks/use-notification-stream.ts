"use client";

import { useEffect, useRef } from "react";

// NOTE: GET /api/v1/notifications/stream may not be live yet (Phase 2 per
// architecture.md §5) — this hook is scaffolding for when it lands.

export interface UseNotificationStreamOptions {
  /** Base API origin, e.g. from NEXT_PUBLIC_API_URL. */
  baseUrl: string;
  /** Called with each parsed notification payload as it arrives. */
  onEvent: (data: unknown) => void;
  /** Skip opening the stream, e.g. while the user is unauthenticated. */
  enabled?: boolean;
}

/**
 * Opens one EventSource against the per-user notifications stream and forwards
 * each message to `onEvent`. Callers typically call `queryClient.invalidateQueries`
 * from `onEvent` per architecture.md §4's SSE-just-invalidates pattern.
 */
export function useNotificationStream({
  baseUrl,
  onEvent,
  enabled = true,
}: UseNotificationStreamOptions): void {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled) return;

    const source = new EventSource(`${baseUrl}/notifications/stream`, {
      withCredentials: true,
    });

    const handleMessage = (event: MessageEvent<string>) => {
      try {
        onEventRef.current(JSON.parse(event.data));
      } catch {
        onEventRef.current(event.data);
      }
    };

    source.addEventListener("message", handleMessage);

    return () => {
      source.removeEventListener("message", handleMessage);
      source.close();
    };
  }, [baseUrl, enabled]);
}
