/**
 * Runtime configuration for the API client. Each app calls `configureApiClient`
 * once (e.g. in a root provider) to set the base URL and how to read/persist the
 * access token. Defaults to `NEXT_PUBLIC_API_URL` for the base URL.
 */

export interface ApiClientConfig {
  baseUrl: string;
  getAccessToken: () => string | null;
  setAccessToken: (token: string | null) => void;
  /**
   * Called on a 401 to obtain a fresh access token before a single retry.
   * Wire this to `refreshStaffSession` / a customer equivalent at app bootstrap.
   */
  refreshAccessToken?: () => Promise<{ accessToken: string; refreshToken: string }>;
}

let config: ApiClientConfig = {
  // Same-origin by default: each app proxies /api to the API and holds the
  // tokens in httpOnly cookies. Override for a server-to-server caller.
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "/api/v1",
  getAccessToken: () => null,
  setAccessToken: () => {},
};

export function configureApiClient(next: Partial<ApiClientConfig>): void {
  config = { ...config, ...next };
}

export function getApiClientConfig(): ApiClientConfig {
  return config;
}
