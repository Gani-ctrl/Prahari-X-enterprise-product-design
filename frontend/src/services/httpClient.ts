import { ApiError } from "./apiError";

// ----------------------------------------------------------------------------
// In dev, Vite proxies "/api" straight to the Express server (see
// vite.config.ts), so the browser never needs to know the backend's real
// port and there's no CORS to worry about. In production, point
// VITE_API_BASE_URL at your deployed API's public URL.
// ----------------------------------------------------------------------------
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

const ACCESS_TOKEN_KEY = "prahari-x:access-token";
const REFRESH_TOKEN_KEY = "prahari-x:refresh-token";

export function getStoredToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token);
  else localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setStoredRefreshToken(token: string | null) {
  if (token) localStorage.setItem(REFRESH_TOKEN_KEY, token);
  else localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Registered by authStore so httpClient can react to an unrecoverable
 * session failure (refresh token invalid/expired/revoked) without a
 * circular import between the two modules.
 */
type SessionExpiredHandler = () => void;
let onSessionExpired: SessionExpiredHandler | null = null;
export function registerSessionExpiredHandler(handler: SessionExpiredHandler) {
  onSessionExpired = handler;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean; // attach the bearer token — true by default
  /** internal — prevents infinite refresh loops */
  _isRetry?: boolean;
}

// Only one refresh should ever be in flight at a time; concurrent 401s all
// await the same promise instead of each firing their own /auth/refresh.
let refreshInFlight: Promise<boolean> | null = null;

async function tryRefreshSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const payload = await res.json();
      setStoredToken(payload.accessToken);
      setStoredRefreshToken(payload.refreshToken);
      return true;
    } catch {
      return false;
    }
  })();

  const result = await refreshInFlight;
  refreshInFlight = null;
  return result;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true, _isRetry = false } = options;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const token = getStoredToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Could not reach the PRAHARI X API. Is the server running?", 0);
  }

  // Access token expired mid-session — try a silent refresh once, then
  // retry the original request. Never do this for the auth endpoints
  // themselves (would recurse) or once we've already retried.
  const isAuthEndpoint = path.startsWith("/auth/");
  if (res.status === 401 && auth && !_isRetry && !isAuthEndpoint) {
    const refreshed = await tryRefreshSession();
    if (refreshed) {
      return request<T>(path, { ...options, _isRetry: true });
    }
    setStoredToken(null);
    setStoredRefreshToken(null);
    onSessionExpired?.();
    throw new ApiError("Your session has expired. Please sign in again.", 401, "SESSION_EXPIRED");
  }

  if (res.status === 204) return undefined as T;

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message = payload?.error ?? `Request failed with status ${res.status}.`;
    throw new ApiError(message, res.status, payload?.code);
  }

  return payload as T;
}

export const http = {
  get: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) => request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) => request<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) => request<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) => request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) => request<T>(path, { ...options, method: "DELETE" }),
};
