import { Navigate } from "react-router-dom";

/**
 * Deprecated: OTP-based password reset has been removed for now (to be
 * reintroduced later). Bounce anything still linking here back to the
 * Commander sign-in page.
 */
export default function ForgotPasswordPage() {
  return <Navigate to="/auth/login" replace />;
}
