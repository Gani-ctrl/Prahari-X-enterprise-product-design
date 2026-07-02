import { Suspense, lazy, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { RoleGate } from "@/routes/RoleGate";
import { AppLayout } from "@/layouts/AppLayout";
import { SoldierLayout } from "@/layouts/SoldierLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { COMMAND_ROLES } from "@/types";
import { useAuthStore } from "@/store/authStore";

const LandingPage = lazy(() => import("@/pages/landing/LandingPage"));
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const CommanderSignUpPage = lazy(() => import("@/pages/auth/CommanderSignUpPage"));
const SoldierLoginPage = lazy(() => import("@/pages/auth/SoldierLoginPage"));
const SoldierSignUpPage = lazy(() => import("@/pages/auth/SoldierSignUpPage"));
// Deprecated (kept only so any stale bookmarked links redirect gracefully):
// commander self-signup, OTP forgot-password, and email verification have
// all been removed. See each file for where it now redirects to.
const SignUpPage = lazy(() => import("@/pages/auth/SignUpPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/ForgotPasswordPage"));
const VerifyEmailPage = lazy(() => import("@/pages/auth/VerifyEmailPage"));
const CheckEmailPage = lazy(() => import("@/pages/auth/CheckEmailPage"));
const DashboardPage = lazy(() => import("@/pages/dashboard/DashboardPage"));
const AssignmentCenterPage = lazy(() => import("@/pages/assignments/AssignmentCenterPage"));
const OperationsMapPage = lazy(() => import("@/pages/operations-map/OperationsMapPage"));
const AnalyticsPage = lazy(() => import("@/pages/analytics/AnalyticsPage"));
const SquadsPage = lazy(() => import("@/pages/squads/SquadsPage"));
const ApprovalsPage = lazy(() => import("@/pages/approvals/ApprovalsPage"));
const OperationsPage = lazy(() => import("@/pages/operations/OperationsPage"));
const MissionDetailsPage = lazy(() => import("@/pages/operations/MissionDetailsPage"));
const IntelligencePage = lazy(() => import("@/pages/intelligence/IntelligencePage"));
const AssetsPage = lazy(() => import("@/pages/assets/AssetsPage"));
const WeaponsPage = lazy(() => import("@/pages/weapons/WeaponsPage"));
const TrainingPage = lazy(() => import("@/pages/training/TrainingPage"));
const UnitManagementPage = lazy(() => import("@/pages/units/UnitManagementPage"));
const FleetLogisticsPage = lazy(() => import("@/pages/fleet/FleetLogisticsPage"));
const MedicalCommsPage = lazy(() => import("@/pages/medical-comms/MedicalCommsPage"));
const BaseEmergencyPage = lazy(() => import("@/pages/base-emergency/BaseEmergencyPage"));
const SituationRoomPage = lazy(() => import("@/pages/situation-room/SituationRoomPage"));
const PersonnelPage = lazy(() => import("@/pages/personnel/PersonnelPage"));
const AIAssistantPage = lazy(() => import("@/pages/ai-assistant/AIAssistantPage"));
const SettingsPage = lazy(() => import("@/pages/settings/SettingsPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

const SoldierDashboardPage = lazy(() => import("@/pages/soldier/SoldierDashboardPage"));
const SoldierMissionsPage = lazy(() => import("@/pages/soldier/SoldierMissionsPage"));
const SoldierEquipmentPage = lazy(() => import("@/pages/soldier/SoldierEquipmentPage"));
const SoldierTrainingPage = lazy(() => import("@/pages/soldier/SoldierTrainingPage"));
const SoldierCommsPage = lazy(() => import("@/pages/soldier/SoldierCommsPage"));
const SoldierProfilePage = lazy(() => import("@/pages/soldier/SoldierProfilePage"));

export default function App() {
  const restoreSession = useAuthStore((s) => s.restoreSession);

  // Validate any existing token against the server exactly once on boot —
  // ProtectedRoute holds off on rendering/redirecting until this resolves
  // (see `isRestoring`), so a still-valid session never flashes a login
  // redirect and a dead one never briefly shows a protected page.
  useEffect(() => {
    restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route element={<AuthLayout />}>
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/commander/signup" element={<CommanderSignUpPage />} />
          <Route path="/auth/soldier/login" element={<SoldierLoginPage />} />
          <Route path="/auth/soldier/signup" element={<SoldierSignUpPage />} />
          {/* Deprecated routes — redirect stubs only, see each component. */}
          <Route path="/auth/signup" element={<SignUpPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
          <Route path="/auth/check-email" element={<CheckEmailPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          {/* Command staff portal — Commander and the other COMMAND_ROLES. */}
          <Route element={<RoleGate allow={COMMAND_ROLES} />}>
            <Route element={<AppLayout />}>
              <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
              <Route path="/app/dashboard" element={<DashboardPage />} />
              <Route path="/app/assignments" element={<AssignmentCenterPage />} />
              <Route path="/app/operations-map" element={<OperationsMapPage />} />
              <Route path="/app/analytics" element={<AnalyticsPage />} />
              <Route path="/app/squads" element={<SquadsPage />} />
              <Route path="/app/approvals" element={<ApprovalsPage />} />
              <Route path="/app/situation-room" element={<SituationRoomPage />} />
              <Route path="/app/operations" element={<OperationsPage />} />
              <Route path="/app/operations/:missionId" element={<MissionDetailsPage />} />
              <Route path="/app/intelligence" element={<IntelligencePage />} />
              <Route path="/app/assets" element={<AssetsPage />} />
              <Route path="/app/weapons" element={<WeaponsPage />} />
              <Route path="/app/training" element={<TrainingPage />} />
              <Route path="/app/units" element={<UnitManagementPage />} />
              <Route path="/app/fleet" element={<FleetLogisticsPage />} />
              <Route path="/app/medical-comms" element={<MedicalCommsPage />} />
              <Route path="/app/base-emergency" element={<BaseEmergencyPage />} />
              <Route path="/app/personnel" element={<PersonnelPage />} />
              <Route path="/app/ai-assistant" element={<AIAssistantPage />} />
              <Route path="/app/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* Soldier portal — scoped strictly to the signed-in soldier's own data. */}
          <Route element={<RoleGate allow={["soldier"]} />}>
            <Route element={<SoldierLayout />}>
              <Route path="/soldier" element={<Navigate to="/soldier/dashboard" replace />} />
              <Route path="/soldier/dashboard" element={<SoldierDashboardPage />} />
              <Route path="/soldier/missions" element={<SoldierMissionsPage />} />
              <Route path="/soldier/equipment" element={<SoldierEquipmentPage />} />
              <Route path="/soldier/training" element={<SoldierTrainingPage />} />
              <Route path="/soldier/comms" element={<SoldierCommsPage />} />
              <Route path="/soldier/profile" element={<SoldierProfilePage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
