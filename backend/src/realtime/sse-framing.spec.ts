import {
  createHeartbeat,
  formatSseComment,
  formatSseEvent,
  SSE_HEADERS,
} from './sse-framing.js';

describe('formatSseEvent', () => {
  it('frames a named event with id and JSON data', () => {
    const frame = formatSseEvent({
      event: 'message',
      id: 'abc',
      data: { hello: 'world' },
    });
    expect(frame).toBe(
      'event: message\nid: abc\ndata: {"hello":"world"}\n\n',
    );
  });

  it('omits the event line when no event name is given', () => {
    const frame = formatSseEvent({ data: { a: 1 } });
    expect(frame).toBe('data: {"a":1}\n\n');
    expect(frame).not.toContain('event:');
  });

  it('omits the id line when no id is given', () => {
    const frame = formatSseEvent({ event: 'ping', data: 'x' });
    expect(frame).not.toContain('id:');
  });

  it('prefixes every line of multi-line JSON with "data: "', () => {
    const frame = formatSseEvent({ data: { a: 1, b: 2 } });
    const dataLines = frame
      .split('\n')
      .filter((l) => l.length > 0 && l !== '');
    for (const line of dataLines) {
      expect(line.startsWith('data: ')).toBe(true);
    }
  });

  it('always terminates with a blank line', () => {
    const frame = formatSseEvent({ data: 'x' });
    expect(frame.endsWith('\n\n')).toBe(true);
  });
});

describe('formatSseComment', () => {
  it('formats a comment line usable as a heartbeat', () => {
    expect(formatSseComment('ping')).toBe(': ping\n\n');
  });
});

describe('SSE_HEADERS', () => {
  it('sets the required event-stream headers', () => {
    expect(SSE_HEADERS['Content-Type']).toBe('text/event-stream');
    expect(SSE_HEADERS['Cache-Control']).toBe('no-cache');
    expect(SSE_HEADERS.Connection).toBe('keep-alive');
    expect(SSE_HEADERS['X-Accel-Buffering']).toBe('no');
  });
});

describe('createHeartbeat', () => {
  it('returns a stop function that clears the interval', () => {
    vi.useFakeTimers();
    const chunks: string[] = [];
    const stop = createHeartbeat((chunk) => chunks.push(chunk), 1000);

    vi.advanceTimersByTime(2500);
    expect(chunks.length).toBe(2);
    expect(chunks[0]).toBe(': ping\n\n');

    stop();
    vi.advanceTimersByTime(5000);
    expect(chunks.length).toBe(2);

    vi.useRealTimers();
  });
});
