import { prisma } from "@/lib/prisma";
import { configuredApiEnvironments, isCrmInboundConfigured } from "./config";
import { deliverOutboxEvents } from "./events";
import { ensureCrmTables } from "./schema";
import { processWebhookEvents } from "./webhooks";

// Background loop (started from src/instrumentation.ts): retries undelivered
// platform events, finishes webhooks whose processing was interrupted, and
// clears expired bookkeeping rows.

const TICK_MS = 60_000;
const DAY_MS = 24 * 60 * 60_000;

const globalForWorker = globalThis as unknown as { crymadCrmWorker?: ReturnType<typeof setInterval> };

async function purge() {
  const now = Date.now();
  await Promise.all([
    prisma.crmReplayGuard.deleteMany({ where: { expiresAt: { lt: new Date(now) } } }),
    prisma.crmIdempotencyKey.deleteMany({ where: { createdAt: { lt: new Date(now - 7 * DAY_MS) } } }),
    prisma.crmWebhookEvent.deleteMany({
      where: { status: { in: ["processed", "ignored"] }, receivedAt: { lt: new Date(now - 30 * DAY_MS) } },
    }),
    prisma.crmOutboxEvent.deleteMany({ where: { sentAt: { lt: new Date(now - 30 * DAY_MS) } } }),
  ]);
}

let running = false;

export async function runCrmWorkerTick() {
  const api = configuredApiEnvironments().length > 0;
  const inbound = isCrmInboundConfigured();
  if ((!api && !inbound) || running) return;
  running = true;
  try {
    await ensureCrmTables();
    if (api) await deliverOutboxEvents();
    if (inbound) await processWebhookEvents();
    await purge();
  } catch (error) {
    console.error("[crymad-crm] Background tick failed", error);
  } finally {
    running = false;
  }
}

export function startCrmWorker() {
  if (globalForWorker.crymadCrmWorker || process.env.NEXT_PHASE === "phase-production-build") return;
  const interval = setInterval(runCrmWorkerTick, TICK_MS);
  interval.unref?.();
  globalForWorker.crymadCrmWorker = interval;
  setTimeout(runCrmWorkerTick, 10_000).unref?.();
}
