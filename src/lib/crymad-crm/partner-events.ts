import type { User, UserStatus } from "@prisma/client";
import { emitPlatformEvent } from "./events";

// Maps partner account changes to contract section 6 events. Only partners are
// CRM customers; admin accounts never produce events.

type PartnerRef = Pick<User, "id" | "email" | "role">;

export async function emitPartnerStatusChange(
  user: PartnerRef,
  previous: UserStatus,
  next: UserStatus,
  source: "admin" | "registration"
) {
  if (user.role !== "PARTNER" || previous === next) return;
  if (next === "BANNED") {
    await emitPlatformEvent("account.restricted", user, { restrictions: ["account_locked"], source });
  } else if (previous === "BANNED") {
    await emitPlatformEvent("account.unrestricted", user, { restrictions: [], source });
  } else {
    await emitPlatformEvent("customer.updated", user, { fields: ["status"], status: next.toLowerCase(), source });
  }
}

const PROFILE_FIELDS = {
  fullName: "name",
  phone: "phone",
  address: "address",
  socialMedia: "social_media",
  desiredNetworkSize: "desired_network_size",
  pipzenReferralLink: "referral_link",
  referrerId: "referrer",
  profileCompleted: "profile_completed",
} as const;

// Names the profile fields that changed, without their values.
export function changedProfileFields(before: Partial<User>, after: Partial<User>) {
  return (Object.keys(PROFILE_FIELDS) as (keyof typeof PROFILE_FIELDS)[])
    .filter((key) => key in after && JSON.stringify(before[key] ?? null) !== JSON.stringify(after[key] ?? null))
    .map((key) => PROFILE_FIELDS[key]);
}

export async function emitPartnerProfileUpdate(user: PartnerRef, fields: string[], source: "admin" | "partner") {
  if (user.role !== "PARTNER" || fields.length === 0) return;
  await emitPlatformEvent("customer.updated", user, { fields, source });
}
