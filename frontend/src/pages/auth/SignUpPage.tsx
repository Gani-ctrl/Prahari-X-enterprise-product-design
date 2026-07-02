import { Navigate } from "react-router-dom";

/**
 * Deprecated: this generic, pre-portal-split "/auth/signup" route has been
 * replaced by two dedicated pages — "/auth/commander/signup" and
 * "/auth/soldier/signup". Anything still bookmarked/linking here falls back
 * to the Soldier Sign Up page (the more common self-service case); Commander
 * sign-up is linked directly from the Commander Sign In page.
 */
export default function SignUpPage() {
  return <Navigate to="/auth/soldier/signup" replace />;
}
