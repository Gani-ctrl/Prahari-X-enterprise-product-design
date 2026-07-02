// PRAHARI X — one-time SQLite -> PostgreSQL data migration.
//
// Purpose: copy every existing record out of the local SQLite dev.db into
// the production PostgreSQL (Neon) database, preserving original IDs and
// every relationship, with no data loss and no fabricated records. This is
// a data-copy tool, not a schema tool — prisma/schema.prisma and the
// migration in prisma/migrations/20260701192900_npm_run_seed already define
// the PostgreSQL schema; run `npx prisma migrate deploy` against the
// Postgres database FIRST so all 30 tables exist, then run this script.
//
// Usage (from the server/ directory):
//   1. Make sure DATABASE_URL in .env points at the target Postgres
//      instance (e.g. your Neon connection string) and that
//      `npx prisma migrate deploy` has already been run against it.
//   2. Make sure the old SQLite file is still present on disk. By default
//      this script looks for prisma/dev.db; override with
//      SQLITE_SOURCE_PATH=/absolute/path/to/dev.db if it lives elsewhere.
//   3. npm install --save-dev better-sqlite3 @types/better-sqlite3
//      (already added to package.json — run `npm install` if needed)
//   4. npx tsx scripts/migrate-sqlite-to-postgres.ts
//
// Safety: refuses to run if the target Postgres database already has any
// User rows, so it can never duplicate or clobber data on a second run —
// consistent with the project's "never overwrite existing records" rule.
// This script does not delete or modify the SQLite source file.

import path from "node:path";
import Database from "better-sqlite3";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const SQLITE_SOURCE_PATH =
  process.env.SQLITE_SOURCE_PATH ?? path.resolve(process.cwd(), "prisma", "dev.db");

// Every model, listed parent-before-child so foreign keys always resolve.
// Matches the CreateTable/AddForeignKey order in
// prisma/migrations/20260701192900_npm_run_seed/migration.sql.
const TABLE_ORDER = [
  "Personnel",
  "User",
  "RefreshToken",
  "LoginHistory",
  "Settings",
  "Squad",
  "Mission",
  "Objective",
  "MissionLog",
  "PersonnelOnMission",
  "Asset",
  "AssetAssignment",
  "ThreatReport",
  "InventoryItem",
  "TrainingProgram",
  "Notification",
  "Chat",
  "ChatMessage",
  "AuditLog",
  "Comment",
  "SquadMember",
  "PatrolRoute",
  "RoutePoint",
  "Assignment",
  "ShiftSchedule",
  "LeaveRequest",
  "FieldReport",
  "MissionDocument",
  "Badge",
  "Attendance",
] as const;

type TableName = (typeof TABLE_ORDER)[number];

function accessorFor(modelName: TableName) {
  return (modelName.charAt(0).toLowerCase() + modelName.slice(1)) as keyof PrismaClient;
}

// Reads field types straight from the generated Prisma DMMF instead of a
// hand-maintained column list, so this script can't drift out of sync with
// schema.prisma if a Boolean/DateTime field is ever added or renamed.
function fieldTypesFor(modelName: TableName) {
  const model = Prisma.dmmf.datamodel.models.find((m) => m.name === modelName);
  if (!model) throw new Error(`Model "${modelName}" not found in Prisma DMMF — is the client generated?`);
  const booleanFields = new Set(model.fields.filter((f) => f.type === "Boolean").map((f) => f.name));
  const dateFields = new Set(model.fields.filter((f) => f.type === "DateTime").map((f) => f.name));
  return { booleanFields, dateFields };
}

// SQLite has no native boolean/date types — Prisma stores booleans as 0/1
// integers and dates as ISO-ish strings/numbers. Coerce both to the real
// JS types the Postgres client expects.
function coerceRow(row: Record<string, unknown>, booleanFields: Set<string>, dateFields: Set<string>) {
  const out: Record<string, unknown> = { ...row };
  for (const key of Object.keys(out)) {
    const value = out[key];
    if (value === null || value === undefined) continue;
    if (booleanFields.has(key)) {
      out[key] = value === 1 || value === true;
    } else if (dateFields.has(key)) {
      out[key] = new Date(value as string | number);
    }
  }
  return out;
}

async function main() {
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log(
      `[migrate-sqlite-to-postgres] Target Postgres database already has ${existingUsers} User row(s). ` +
        `Refusing to run — this script only ever migrates into an empty database, ` +
        `so it can never duplicate or overwrite existing records. Exiting without changes.`
    );
    await prisma.$disconnect();
    return;
  }

  const sqlite = new Database(SQLITE_SOURCE_PATH, { readonly: true, fileMustExist: true });
  console.log(`[migrate-sqlite-to-postgres] Source: ${SQLITE_SOURCE_PATH}`);
  console.log(`[migrate-sqlite-to-postgres] Target: Postgres database from DATABASE_URL`);

  let totalRows = 0;

  for (const table of TABLE_ORDER) {
    const rows = sqlite.prepare(`SELECT * FROM "${table}"`).all() as Record<string, unknown>[];
    if (rows.length === 0) {
      console.log(`[migrate-sqlite-to-postgres] ${table}: 0 rows, skipping`);
      continue;
    }

    const { booleanFields, dateFields } = fieldTypesFor(table);
    const data = rows.map((row) => coerceRow(row, booleanFields, dateFields));
    const accessor = accessorFor(table);

    // createMany over a per-row loop: every row already carries its
    // original ID and every FK column as a plain scalar, and every parent
    // table was inserted earlier in TABLE_ORDER, so relation resolution
    // isn't needed — just a fast bulk insert. skipDuplicates guards a
    // partially-completed prior run from failing on primary-key collisions.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma[accessor] as any).createMany({ data, skipDuplicates: true });
    console.log(`[migrate-sqlite-to-postgres] ${table}: migrated ${rows.length} row(s)`);
    totalRows += rows.length;
  }

  sqlite.close();
  await prisma.$disconnect();
  console.log(`[migrate-sqlite-to-postgres] Done — ${totalRows} total row(s) migrated.`);
  console.log(`[migrate-sqlite-to-postgres] Verify with: npx prisma studio (against the Postgres DATABASE_URL)`);
}

main().catch(async (err) => {
  console.error("[migrate-sqlite-to-postgres] Failed:", err);
  await prisma.$disconnect();
  process.exit(1);
});
