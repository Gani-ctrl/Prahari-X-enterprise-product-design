import * as mock from "./mockApi";
import * as real from "./realApi";

export { ApiError } from "./apiError";

// ----------------------------------------------------------------------------
// Single switch point between the two data sources:
//   VITE_USE_MOCK_API=false  ->  talks to the real Express + Prisma API
//   (anything else, or unset) ->  in-browser mock, persisted to localStorage
//
// Every page imports from this file only, so flipping the env var (and
// restarting `npm run dev`) is the entire migration — see README.md.
// ----------------------------------------------------------------------------
const USE_MOCK = import.meta.env.VITE_USE_MOCK_API !== "false";

const impl = USE_MOCK ? mock : real;

if (import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.info(`[PRAHARI X] Using ${USE_MOCK ? "mock (localStorage)" : "real (Express + Prisma)"} API.`);
}

// Authentication always talks to the real Express + Prisma backend — the
// mock/localStorage auth implementation has been removed. Every other
// domain (missions, personnel, etc.) still respects VITE_USE_MOCK_API.
export const auth = real.auth;
export const dashboard = impl.dashboard;
export const missionsApi = impl.missionsApi;
export const personnelApi = impl.personnelApi;
export const assetsApi = impl.assetsApi;
export const threatsApi = impl.threatsApi;
export const notificationsApi = impl.notificationsApi;
export const aiApi = impl.aiApi;
export const auditApi = impl.auditApi;
export const inventoryApi = impl.inventoryApi;
export const trainingApi = impl.trainingApi;
export const commentsApi = impl.commentsApi;

// Command & Control workflow — new for the C2 platform expansion. These have
// no localStorage/mock implementation (see realApi.ts's comment on why), so
// — like `auth` — they always talk to the real Express + Prisma backend
// regardless of VITE_USE_MOCK_API.
export const assignmentsApi = real.assignmentsApi;
export const reportsApi = real.reportsApi;
export const squadsApi = real.squadsApi;
export const patrolRoutesApi = real.patrolRoutesApi;
export const shiftsApi = real.shiftsApi;
export const leaveApi = real.leaveApi;
export const badgesApi = real.badgesApi;
export const attendanceApi = real.attendanceApi;
export const missionDocumentsApi = real.missionDocumentsApi;
