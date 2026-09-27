import { prisma } from "@/lib/prisma";

// Creates the crm_* tables if they do not exist yet, so a deploy works without
// a separate `prisma db push`. The SQL is what `prisma migrate diff` generates
// for the Crm* models in prisma/schema.prisma, made idempotent. Keep them in
// sync so a later `db push` finds nothing to change.
const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "crm_replay_guard" (
    "signature" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "crm_replay_guard_pkey" PRIMARY KEY ("signature")
  )`,
  `CREATE TABLE IF NOT EXISTS "crm_webhook_events" (
    "id" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'live',
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'received',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "lockedUntil" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    CONSTRAINT "crm_webhook_events_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "crm_outbox_events" (
    "id" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'live',
    "type" TEXT NOT NULL,
    "customerExternalId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedUntil" TIMESTAMP(3),
    "lastError" TEXT,
    "sentAt" TIMESTAMP(3),
    "deadAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "crm_outbox_events_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "crm_idempotency_keys" (
    "key" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "responseStatus" INTEGER,
    "responseBody" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "crm_idempotency_keys_pkey" PRIMARY KEY ("key")
  )`,
  `CREATE TABLE IF NOT EXISTS "crm_action_log" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "customerExternalId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "approvedBy" TEXT,
    "ticketId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "verificationRef" TEXT,
    "dryRun" BOOLEAN NOT NULL,
    "outcome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "crm_action_log_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "crm_replay_guard_expiresAt_idx" ON "crm_replay_guard"("expiresAt")`,
  `CREATE INDEX IF NOT EXISTS "crm_webhook_events_status_receivedAt_idx" ON "crm_webhook_events"("status", "receivedAt")`,
  `CREATE INDEX IF NOT EXISTS "crm_outbox_events_sentAt_nextAttemptAt_idx" ON "crm_outbox_events"("sentAt", "nextAttemptAt")`,
  `CREATE INDEX IF NOT EXISTS "crm_idempotency_keys_createdAt_idx" ON "crm_idempotency_keys"("createdAt")`,
  `CREATE INDEX IF NOT EXISTS "crm_action_log_customerExternalId_idx" ON "crm_action_log"("customerExternalId")`,
];

let ready: Promise<void> | null = null;

export function ensureCrmTables(): Promise<void> {
  if (!ready) {
    ready = prisma
      .$transaction([
        // Serialises the DDL when several instances (partner + admin) boot together.
        prisma.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(hashtext('crymad_crm_schema'))`),
        ...STATEMENTS.map((sql) => prisma.$executeRawUnsafe(sql)),
      ])
      .then(() => undefined)
      .catch((error) => {
        ready = null;
        throw error;
      });
  }
  return ready;
}
