import { configureApiClient, staffRefresh, type AuthTokens } from "@coifyn/api-client";

const STORAGE_KEY = "coifyn_tokens";
const SESSION_COOKIE = "coifyn_session";

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

function readTokens(): StoredTokens | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredTokens) : null;
  } catch {
    return null;
  }
}

/** Persists a fresh token pair and sets the cookie the route proxy gates on. */
export function saveSession(tokens: Pick<AuthTokens, "accessToken" | "refreshToken">): void {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }),
    );
  } catch {
    // Storage unavailable (private mode): the session lasts until reload.
  }
  document.cookie = `${SESSION_COOKIE}=1; path=/; SameSite=Lax`;
}

export function clearSession(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export function getRefreshToken(): string | null {
  return readTokens()?.refreshToken ?? null;
}

let configured = false;

/**
 * Wires @coifyn/api-client to this app's session: bearer token from storage,
 * and one refresh-and-retry on a 401 (the backend rotates the refresh token,
 * so the new pair is written back).
 */
export function configureSession(): void {
  if (configured || typeof window === "undefined") return;
  configured = true;
  configureApiClient({
    getAccessToken: () => readTokens()?.accessToken ?? null,
    setAccessToken: (token) => {
      if (token === null) {
        clearSession();
        return;
      }
      const current = readTokens();
      if (current) saveSession({ ...current, accessToken: token });
    },
    refreshAccessToken: async () => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) throw new Error("No refresh token");
      const tokens = await staffRefresh({ refreshToken });
      saveSession(tokens);
      return tokens;
    },
  });
}
