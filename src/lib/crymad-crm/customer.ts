import { Prisma, type User, type UserStatus, type Withdrawal } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { environmentForEmail, getCrmConfig, type CrmEnvironment } from "./config";

// Partners are identified to the CRM as "pz_partner:<user id>". The prefix
// keeps room for other Pipzen customer types (e.g. traders) under one slug.
export const PARTNER_PREFIX = "pz_partner:";

export function toExternalId(userId: string) {
  return `${PARTNER_PREFIX}${userId}`;
}

export function parseExternalId(value: string): string | null {
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return null;
  }
  if (decoded.startsWith(PARTNER_PREFIX)) decoded = decoded.slice(PARTNER_PREFIX.length);
  else if (decoded.includes(":")) return null; // another customer type, not held here
  return /^[A-Za-z0-9_-]{1,64}$/.test(decoded) ? decoded : null;
}

const USD = "USD";
const ZERO = new Prisma.Decimal(0);

export function money(value: Prisma.Decimal | number | string | null | undefined) {
  return new Prisma.Decimal(value ?? 0).toFixed(2);
}

export function maskAccountNumber(value: string | null) {
  if (!value) return null;
  const digits = value.replace(/\s+/g, "");
  return digits.length <= 4 ? "••••" : `••••${digits.slice(-4)}`;
}

// Wallet addresses: first 6 and last 4 characters (contract §7).
export function maskWallet(value: string | null) {
  if (!value) return null;
  return value.length <= 10 ? value : `${value.slice(0, 6)}…${value.slice(-4)}`;
}

export function partnerStatus(status: UserStatus) {
  if (status === "BANNED") return "locked";
  if (status === "INVITED") return "invited";
  return "active";
}

// Neutral restriction codes only (contract v1.1).
export function partnerRestrictions(status: UserStatus) {
  return status === "BANNED" ? ["account_locked"] : [];
}

export function adminUrl(userId: string) {
  return `${getCrmConfig().adminBaseUrl}/admin/partners?partner=${encodeURIComponent(userId)}`;
}

export function withdrawalDestination(w: Withdrawal) {
  if (w.method === "BANK") {
    const account = maskAccountNumber(w.accountNumber);
    return [w.bankName, account].filter(Boolean).join(" ") || "Bank transfer";
  }
  const asset = [w.cryptoType, w.cryptoNetwork ? `(${w.cryptoNetwork})` : null].filter(Boolean).join(" ");
  return [asset || "Crypto", maskWallet(w.walletAddress)].filter(Boolean).join(" ");
}

export function withdrawalLabel(w: Withdrawal) {
  return `${USD} ${money(w.amount)} to ${withdrawalDestination(w)}`;
}

// A partner is visible to one CRM environment only: test accounts to test
// keys, every other partner to live keys.
export function inEnvironment<T extends Pick<User, "email">>(user: T | null, env: CrmEnvironment): T | null {
  return user && environmentForEmail(user.email) === env ? user : null;
}

export async function findPartnerById(env: CrmEnvironment, userId: string) {
  return inEnvironment(await prisma.user.findFirst({ where: { id: userId, role: "PARTNER" } }), env);
}

export async function findPartnerByEmail(env: CrmEnvironment, email: string) {
  return inEnvironment(
    await prisma.user.findFirst({ where: { email: email.trim().toLowerCase(), role: "PARTNER" } }),
    env
  );
}

export async function partnerBalance(userId: string) {
  const [paid, pending, withdrawn, pendingWithdrawals] = await Promise.all([
    prisma.commission.aggregate({ where: { earnerId: userId, status: "PAID" }, _sum: { commissionAmount: true } }),
    prisma.commission.aggregate({ where: { earnerId: userId, status: "PENDING" }, _sum: { commissionAmount: true } }),
    prisma.withdrawal.aggregate({ where: { userId, status: "APPROVED" }, _sum: { amount: true } }),
    prisma.withdrawal.aggregate({ where: { userId, status: "PENDING" }, _sum: { amount: true } }),
  ]);
  const earned = paid._sum.commissionAmount ?? ZERO;
  const out = withdrawn._sum.amount ?? ZERO;
  const held = pendingWithdrawals._sum.amount ?? ZERO;
  return {
    totalEarned: earned,
    pendingCommissions: pending._sum.commissionAmount ?? ZERO,
    totalWithdrawn: out,
    pendingWithdrawals: held,
    available: earned.minus(out).minus(held),
  };
}

// Size of the partner's whole downline. UNION (not UNION ALL) stops on cycles
// that manual referrer edits could create.
async function networkSize(userId: string) {
  const rows = await prisma.$queryRaw<{ count: bigint }[]>`
    WITH RECURSIVE downline AS (
      SELECT "id", 1 AS depth FROM "users" WHERE "referrerId" = ${userId}
      UNION
      SELECT u."id", d.depth + 1 FROM "users" u JOIN downline d ON u."referrerId" = d."id" WHERE d.depth < 50
    )
    SELECT COUNT(DISTINCT "id") AS count FROM downline WHERE "id" <> ${userId}`;
  return Number(rows[0]?.count ?? 0);
}

// Contract section 7 customer lookup for a partner, plus the Pipzen "extras" block.
export async function buildPartnerLookup(env: CrmEnvironment, partner: User) {
  const [balance, referrer, directReferrals, totalNetwork, commissions, withdrawals, pendingWithdrawals, badges] =
    await Promise.all([
      partnerBalance(partner.id),
      partner.referrerId
        ? prisma.user.findUnique({
            where: { id: partner.referrerId },
            select: { id: true, fullName: true, role: true, email: true },
          })
        : null,
      prisma.user.count({ where: { referrerId: partner.id } }),
      networkSize(partner.id),
      prisma.commission.findMany({
        where: { earnerId: partner.id },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 10,
        include: { purchase: { select: { packageName: true, packageType: true, amount: true } } },
      }),
      prisma.withdrawal.findMany({
        where: { userId: partner.id },
        orderBy: [{ requestedAt: "desc" }, { id: "desc" }],
        take: 10,
      }),
      prisma.withdrawal.findMany({
        where: { userId: partner.id, status: "PENDING" },
        orderBy: { requestedAt: "asc" },
      }),
      prisma.badgeAward.findMany({
        where: { userId: partner.id },
        orderBy: { awardedAt: "asc" },
        include: { badge: { select: { name: true } } },
      }),
    ]);

  const activity = [
    ...commissions.map((c) => ({
      id: c.id,
      type: "commission",
      asset: USD,
      amount: money(c.commissionAmount),
      status: c.status.toLowerCase(),
      created_at: c.createdAt.toISOString(),
      reference: c.id,
    })),
    ...withdrawals.map((w) => ({
      id: w.id,
      type: "withdrawal",
      asset: USD,
      amount: money(w.amount),
      status: w.status.toLowerCase(),
      created_at: w.requestedAt.toISOString(),
      reference: w.id,
    })),
  ]
    .sort((a, b) => (a.created_at === b.created_at ? b.id.localeCompare(a.id) : b.created_at.localeCompare(a.created_at)))
    .slice(0, 10);

  return {
    profile: {
      id: toExternalId(partner.id),
      email: partner.email,
      name: partner.fullName,
      username: partner.referralCode,
      status: partnerStatus(partner.status),
      country: null,
      language: "en",
      created_at: partner.createdAt.toISOString(),
      admin_url: adminUrl(partner.id),
    },
    verification: {
      // Partners register through an invitation link sent to this address.
      email_verified: partner.status !== "INVITED" && partner.passwordHash !== null,
      kyc_level: null,
      kyc_status: "not_required",
      twofa_enabled: false,
    },
    risk: {
      flags: [],
      restrictions: partnerRestrictions(partner.status),
    },
    balances: [
      {
        asset: USD,
        available: money(balance.available),
        locked: money(balance.pendingWithdrawals),
        usd_value: money(balance.available),
      },
    ],
    recent_activity: activity,
    security: {
      last_login_at: partner.lastLoginAt?.toISOString() ?? null,
      recent_devices: [],
      recent_changes: [],
    },
    open_items: pendingWithdrawals.map((w) => ({
      type: "withdrawal",
      id: w.id,
      status: "pending",
      label: withdrawalLabel(w),
    })),
    extras: {
      customer_type: "partner",
      visibility: "full",
      partner: {
        referral_code: partner.referralCode,
        pipzen_referral_link: partner.pipzenReferralLink,
        profile_completed: partner.profileCompleted,
        referred_by:
          referrer && referrer.role === "PARTNER" && inEnvironment(referrer, env)
            ? { id: toExternalId(referrer.id), name: referrer.fullName }
            : null,
        network: { direct_referrals: directReferrals, total_network: totalNetwork },
        earnings: {
          asset: USD,
          total_earned: money(balance.totalEarned),
          pending_commissions: money(balance.pendingCommissions),
          total_withdrawn: money(balance.totalWithdrawn),
          pending_withdrawals: money(balance.pendingWithdrawals),
          available_balance: money(balance.available),
        },
        recent_commissions: commissions.map((c) => ({
          id: c.id,
          level: c.level,
          rate_percent: money(c.rate),
          amount: money(c.commissionAmount),
          status: c.status.toLowerCase(),
          purchase: {
            package: c.purchase.packageName,
            package_type: c.purchase.packageType.toLowerCase(),
            amount: money(c.purchase.amount),
          },
          created_at: c.createdAt.toISOString(),
        })),
        withdrawals: withdrawals.map((w) => ({
          id: w.id,
          amount: money(w.amount),
          method: w.method.toLowerCase(),
          destination: withdrawalDestination(w),
          status: w.status.toLowerCase(),
          admin_note: w.adminNote,
          requested_at: w.requestedAt.toISOString(),
          processed_at: w.processedAt?.toISOString() ?? null,
        })),
        badges: badges.map((b) => ({ name: b.badge.name, awarded_at: b.awardedAt.toISOString() })),
      },
    },
  };
}
