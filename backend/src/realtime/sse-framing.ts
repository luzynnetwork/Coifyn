/**
 * Pure WHATWG Server-Sent-Events framing helpers. No NestJS dependency injection
 * here — these are called from any controller that writes an SSE response
 * (realtime.controller.ts, notifications.controller.ts) so they stay plain
 * exported functions rather than an injectable service.
 */

/** Standard headers an SSE response must send before the first chunk. Proxies
 *  that buffer by default (nginx) are told not to via X-Accel-Buffering. */
export const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no',
} as const;

/** A platform/load-balancer request timeout typically sits at 60s-a few
 *  minutes; self-closing before that lets the client reconnect cleanly instead
 *  of seeing a hard socket reset. */
export const MAX_STREAM_DURATION_MS = 5 * 60_000;

export interface SseEventInput {
  /** The `event:` field. Omit for an unnamed ("message") event. */
  event?: string;
  /** JSON-serialized as the `data:` field. Each line of the stringified value
   *  is prefixed with "data: " per the SSE spec (multi-line JSON.stringify
   *  output, e.g. from an indented payload, still frames correctly). */
  data: unknown;
  /** The `id:` field, echoed back by the client as `Last-Event-ID` on
   *  reconnect. */
  id?: string;
}

/** Formats one SSE event frame, terminated by the required blank line. */
export function formatSseEvent(input: SseEventInput): string {
  let frame = '';
  if (input.event !== undefined) {
    frame += `event: ${input.event}\n`;
  }
  if (input.id !== undefined) {
    frame += `id: ${input.id}\n`;
  }
  const json = JSON.stringify(input.data);
  for (const line of json.split('\n')) {
    frame += `data: ${line}\n`;
  }
  frame += '\n';
  return frame;
}

/** Formats an SSE comment line — invisible to `EventSource.onmessage`, used as
 *  a heartbeat to keep idle connections (and intermediate proxies) alive. */
export function formatSseComment(text: string): string {
  return `: ${text}\n\n`;
}

/** Starts a periodic heartbeat comment on the given writer. Returns a stop
 *  function that clears the interval — callers must invoke it when the
 *  request closes to avoid leaking timers. */
export function createHeartbeat(
  writeFn: (chunk: string) => void,
  intervalMs = 20_000,
): () => void {
  const timer = setInterval(() => {
    writeFn(formatSseComment('ping'));
  }, intervalMs);
  return () => clearInterval(timer);
}
