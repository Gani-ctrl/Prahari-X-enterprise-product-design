import { Navigate } from "react-router-dom";

/**
 * Deprecated: registration no longer requires an email-verification step,
 * so there's nothing to "check your email" for anymore. Bounce anything
 * still linking here to the Soldier sign-in page.
 */
export default function CheckEmailPage() {
  return <Navigate to="/auth/soldier/login" replace />;
}
