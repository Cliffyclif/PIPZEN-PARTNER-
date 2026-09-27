import type { Commission, Purchase, Withdrawal } from "@prisma/client";
import { money, withdrawalDestination } from "./customer";

// Shapes shared by the transactions, orders and lookup endpoints.

type CommissionWithPurchase = Commission & { purchase: Pick<Purchase, "packageName" | "packageType" | "amount"> };

export function commissionRecord(c: CommissionWithPurchase) {
  return {
    id: c.id,
    type: "commission",
    asset: "USD",
    amount: money(c.commissionAmount),
    status: c.status.toLowerCase(),
    created_at: c.createdAt.toISOString(),
    reference: c.id,
    details: {
      level: c.level,
      rate_percent: money(c.rate),
      package: c.purchase.packageName,
      package_type: c.purchase.packageType.toLowerCase(),
      purchase_amount: money(c.purchase.amount),
    },
  };
}

export function withdrawalRecord(w: Withdrawal) {
  return {
    id: w.id,
    type: "withdrawal",
    asset: "USD",
    amount: money(w.amount),
    status: w.status.toLowerCase(),
    created_at: w.requestedAt.toISOString(),
    reference: w.id,
    details: {
      method: w.method.toLowerCase(),
      destination: withdrawalDestination(w),
      admin_note: w.adminNote,
      processed_at: w.processedAt?.toISOString() ?? null,
    },
  };
}

export function purchaseRecord(p: Purchase) {
  return {
    id: p.id,
    type: "purchase",
    asset: "USD",
    amount: money(p.amount),
    status: "completed",
    created_at: p.purchasedAt.toISOString(),
    reference: p.id,
    details: {
      package: p.packageName,
      package_type: p.packageType.toLowerCase(),
    },
  };
}
