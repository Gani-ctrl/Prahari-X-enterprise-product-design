import { create } from "zustand";
import type { User } from "@/types";
import { auth, ApiError } from "@/services/api";
import type { Portal } from "@/services/realApi";
import {
  setStoredToken,
  setStoredRefreshToken,
  getStoredToken,
  getStoredRefreshToken,
  registerSessionExpiredHandler,
} from "@/services/httpClient";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  /** True once the initial session-restoration check (validating any stored token against the server) has finished — gates the router so it never flashes a protected page before we know the real auth state. */
  isRestoring: boolean;
  isLoading: boolean;
  error: string | null;
  errorCode: string | null;
  /** `portal` is required and is enforced server-side — a Soldier account can
   * never authenticate against the Commander portal and vice versa. */
  login: (email: string, password: string, rememberMe: boolean, portal: Portal) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    portal: Portal
  ) => Promise<{ success: boolean; message: string; email: string }>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  updateProfile: (patch: Partial<{ name: string; email: string; rank: string; unit: string; phone: string; avatarSeed: string; profileImageUrl: string }>) => Promise<void>;
  clearError: () => void;
}

const USER_STORAGE_KEY = "prahari-x:session-user";

function loadStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function persistUser(user: User | null) {
  if (user) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_STORAGE_KEY);
}

function clearSession() {
  persistUser(null);
  setStoredToken(null);
  setStoredRefreshToken(null);
}

const hadStoredToken = Boolean(getStoredToken());

export const useAuthStore = create<AuthState>((set) => ({
  // Optimistic hydration from localStorage so there's no login flash on
  // reload — restoreSession() (triggered from App on boot) then validates
  // this against the server and corrects it if the token is stale/revoked.
  user: loadStoredUser(),
  isAuthenticated: hadStoredToken,
  isRestoring: hadStoredToken,
  isLoading: false,
  error: null,
  errorCode: null,

  async login(email, password, rememberMe, portal) {
    set({ isLoading: true, error: null, errorCode: null });
    try {
      const { user, accessToken, refreshToken } = await auth.login(email, password, rememberMe, portal);
      setStoredToken(accessToken);
      setStoredRefreshToken(refreshToken);
      persistUser(user);
      set({ user, isAuthenticated: true, isLoading: false, isRestoring: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed.";
      const code = err instanceof ApiError ? err.code : undefined;
      set({ isLoading: false, error: message, errorCode: code ?? null });
      throw err;
    }
  },

  async register(name, email, password, portal) {
    set({ isLoading: true, error: null, errorCode: null });
    try {
      const result = await auth.register(name, email, password, portal);
      set({ isLoading: false });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed.";
      const code = err instanceof ApiError ? err.code : undefined;
      set({ isLoading: false, error: message, errorCode: code ?? null });
      throw err;
    }
  },

  async logout() {
    const refreshToken = getStoredRefreshToken();
    // Clear local state first so the UI reacts instantly — the server-side
    // token revocation is best-effort and shouldn't block the redirect.
    clearSession();
    set({ user: null, isAuthenticated: false, isRestoring: false });
    try {
      await auth.logout(refreshToken);
    } catch {
      // Token may already be expired/revoked — nothing more to do locally.
    }
  },

  async restoreSession() {
    const token = getStoredToken();
    const refreshToken = getStoredRefreshToken();
    if (!token && !refreshToken) {
      set({ isRestoring: false, isAuthenticated: false, user: null });
      return;
    }
    try {
      const user = await auth.me();
      persistUser(user);
      set({ user, isAuthenticated: true, isRestoring: false });
    } catch {
      // Access token invalid/expired — httpClient already attempted a
      // silent refresh internally as part of that request; if we're still
      // here, the session is genuinely gone.
      clearSession();
      set({ user: null, isAuthenticated: false, isRestoring: false });
    }
  },

  // Persists a profile edit (name/email/rank/unit/phone/avatar) to the
  // backend, then immediately updates the in-memory + localStorage copy of
  // the user so every consumer of useAuthStore((s) => s.user) — Topbar,
  // Settings, both portal layouts — re-renders with the new values without
  // a refresh or re-login. The server mirrors the same edit onto the linked
  // Personnel record (Soldier accounts only), so Personnel-driven pages stay
  // in sync too; see PUT /auth/me.
  async updateProfile(patch) {
    const user = await auth.updateProfile(patch);
    persistUser(user);
    set({ user });
  },

  clearError() {
    set({ error: null, errorCode: null });
  },
}));

// Wire httpClient's "the refresh token is dead" signal back into the store,
// so any background API call that discovers an expired session immediately
// reflects that in the UI (and, combined with ProtectedRoute, redirects to
// /auth/login) rather than leaving stale authenticated state around.
registerSessionExpiredHandler(() => {
  clearSession();
  useAuthStore.setState({ user: null, isAuthenticated: false, isRestoring: false });
});

// Keep other browser tabs in sync: if the user logs out (or in) in one tab,
// the session-user key changes, so mirror that here.
window.addEventListener("storage", (e) => {
  if (e.key !== USER_STORAGE_KEY) return;
  const user = loadStoredUser();
  useAuthStore.setState({ user, isAuthenticated: Boolean(user && getStoredToken()) });
});
