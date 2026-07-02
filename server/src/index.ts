import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { authRouter } from "./routes/auth.routes.js";
import { missionsRouter } from "./routes/missions.routes.js";
import { dashboardRouter } from "./routes/dashboard.routes.js";
import { assetsRouter } from "./routes/assets.routes.js";
import { personnelRouter } from "./routes/personnel.routes.js";
import { threatsRouter } from "./routes/threats.routes.js";
import { notificationsRouter } from "./routes/notifications.routes.js";
import { chatsRouter } from "./routes/chats.routes.js";
import { auditRouter } from "./routes/audit.routes.js";
import { inventoryRouter } from "./routes/inventory.routes.js";
import { trainingRouter } from "./routes/training.routes.js";
import { commentsRouter } from "./routes/comments.routes.js";
import { assignmentsRouter } from "./routes/assignments.routes.js";
import { reportsRouter } from "./routes/reports.routes.js";
import { squadsRouter, patrolRoutesRouter } from "./routes/squads.routes.js";
import { shiftsRouter, leaveRouter, badgesRouter, attendanceRouter } from "./routes/personnel-ops.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { isSmtpConfigured } from "./lib/mailer.js";

const app = express();

// CLIENT_ORIGIN accepts one origin or a comma-separated list, so both the
// production Vercel domain and Vercel's per-deploy preview URLs can be
// allowed at once (e.g. "https://prahari-x.vercel.app,https://prahari-x-git-main-you.vercel.app").
// Falls back to the local Vite dev server when unset.
const allowedOrigins = (process.env.CLIENT_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      // Same-origin / non-browser requests (curl, server-to-server, the
      // Render health check) send no Origin header at all — always allow.
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin "${origin}" is not in CLIENT_ORIGIN`));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => res.json({ status: "ok", service: "prahari-x-api" }));

// Every resource route lives under /api — this is what the frontend's Vite
// dev proxy forwards to (see frontend/vite.config.ts), and what
// VITE_API_BASE_URL should point at in production.
const api = express.Router();
api.use("/auth", authRouter);
api.use("/missions", missionsRouter);
api.use("/dashboard", dashboardRouter);
api.use("/assets", assetsRouter);
api.use("/personnel", personnelRouter);
api.use("/threats", threatsRouter);
api.use("/notifications", notificationsRouter);
api.use("/chats", chatsRouter);
api.use("/audit-logs", auditRouter);
api.use("/inventory", inventoryRouter);
api.use("/training", trainingRouter);
api.use("/comments", commentsRouter);
api.use("/assignments", assignmentsRouter);
api.use("/reports", reportsRouter);
api.use("/squads", squadsRouter);
api.use("/patrol-routes", patrolRoutesRouter);
api.use("/shifts", shiftsRouter);
api.use("/leave", leaveRouter);
api.use("/badges", badgesRouter);
api.use("/attendance", attendanceRouter);
app.use("/api", api);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, () => {
  console.log(`PRAHARI X API listening on http://localhost:${PORT} (routes mounted under /api)`);
  console.log(
    isSmtpConfigured()
      ? `[MAIL] SMTP configured (${process.env.SMTP_HOST}) — verification/reset emails will be sent for real.`
      : `[MAIL] SMTP not configured — verification links and OTP codes will be printed to this console instead.`
  );
});
