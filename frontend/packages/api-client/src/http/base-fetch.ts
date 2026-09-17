import { ApiError, parseApiError } from "./errors.js";
import { getApiClientConfig } from "./config.js";

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Sent as the `Idempotency-Key` header — required for retried mutating calls. */
  idempotencyKey?: string;
  /** Set false to skip the Authorization header (e.g. login/register). */
  authenticated?: boolean;
  /** Internal: prevents infinite refresh loops. */
  isRetry?: boolean;
}

/**
 * Fetch wrapper shared by every typed call. Reads the base URL + token from
 * `configureApiClient`, sends cookies, injects the bearer token, and on a 401
 * runs the configured refresh handler once before retrying the request.
 */
export async function baseFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const config = getApiClientConfig();
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (options.authenticated !== false) {
    const token = config.getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  if (options.idempotencyKey) {
    headers["Idempotency-Key"] = options.idempotencyKey;
  }

  const response = await fetch(`${config.baseUrl}${path}`, {
    method: options.method ?? "GET",
    credentials: "include",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401 && options.authenticated !== false && !options.isRetry) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return baseFetch<T>(path, { ...options, isRetry: true });
    }
  }

  if (!response.ok) {
    throw await parseApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

/** Runs the app-configured refresh handler at most once per 401. */
async function tryRefresh(): Promise<boolean> {
  const config = getApiClientConfig();
  if (!config.refreshAccessToken) return false;
  try {
    const tokens = await config.refreshAccessToken();
    config.setAccessToken(tokens.accessToken);
    return true;
  } catch (error) {
    config.setAccessToken(null);
    if (error instanceof ApiError) return false;
    return false;
  }
}
