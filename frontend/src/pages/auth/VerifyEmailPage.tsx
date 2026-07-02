import { Navigate } from "react-router-dom";

/**
 * Deprecated: email verification has been removed for now (accounts are
 * active immediately on registration). Bounce anything still linking here
 * back to the Commander sign-in page.
 */
export default function VerifyEmailPage() {
  return <Navigate to="/auth/login" replace />;
}
