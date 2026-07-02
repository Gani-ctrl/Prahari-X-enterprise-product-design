import { useEffect } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isRestoring = useAuthStore((s) => s.isRestoring);
  const location = useLocation();
  const navigate = useNavigate();

  // Soldier routes bounce to the Soldier sign-in page, everything else
  // (the Commander "/app" portal) bounces to the Commander sign-in page —
  // keeps the two portals' login prompts fully separate.
  const loginPath = location.pathname.startsWith("/soldier") ? "/auth/soldier/login" : "/auth/login";

  // Defends against the browser's back/forward cache (bfcache) restoring a
  // fully-rendered protected page after logout without re-running React's
  // auth check — e.g. sign out, then hit Back. On a bfcache restore
  // (`event.persisted`), re-validate the current store state and bounce to
  // login if it's no longer authenticated.
  useEffect(() => {
    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted && !useAuthStore.getState().isAuthenticated) {
        navigate(loginPath, { replace: true });
      }
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [navigate, loginPath]);

  // While the app is validating any existing session against the server
  // (see SessionBootstrap in App.tsx), don't render or redirect yet —
  // otherwise a valid, refreshable session would flash a login redirect.
  if (isRestoring) return <LoadingScreen />;

  if (!isAuthenticated) {
    return <Navigate to={loginPath} replace state={{ from: location }} />;
  }

  return <Outlet />;
}
