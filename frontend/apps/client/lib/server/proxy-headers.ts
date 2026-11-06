const FORWARD_REQUEST = [
  "content-type",
  "accept",
  "idempotency-key",
  "last-event-id",
  "x-correlation-id",
];

const FORWARD_RESPONSE = [
  "content-type",
  "cache-control",
  "x-correlation-id",
  "x-accel-buffering",
];

/** The few request headers the API cares about, plus the bearer token. */
export function requestHeaders(req: Request, accessToken?: string): Headers {
  const headers = new Headers();
  for (const name of FORWARD_REQUEST) {
    const value = req.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);
  return headers;
}

/** Only safe, meaningful response headers — never hop-by-hop or encoding ones. */
export function responseHeaders(upstream: Headers): Headers {
  const headers = new Headers();
  for (const name of FORWARD_RESPONSE) {
    const value = upstream.get(name);
    if (value) headers.set(name, value);
  }
  return headers;
}
