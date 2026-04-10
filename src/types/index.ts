import { User, Commission, Purchase, Withdrawal, Badge, BadgeAward, Message } from "@prisma/client";

export type UserWithReferrals = User & {
  referrals: User[];
  referrer: User | null;
};

export type PurchaseWithRelations = Purchase & {
  user: Pick<User, "id" | "fullName" | "email">;
  seededBy: Pick<User, "id" | "fullName" | "email">;
  commissions: Commission[];
};

export type CommissionWithRelations = Commission & {
  purchase: Purchase;
  earner: Pick<User, "id" | "fullName" | "email">;
  buyer: Pick<User, "id" | "fullName" | "email">;
};

export type WithdrawalWithUser = Withdrawal & {
  user: Pick<User, "id" | "fullName" | "email">;
};

export type BadgeWithAwards = Badge & {
  awards: BadgeAward[];
};

export type MessageWithUsers = Message & {
  sender: Pick<User, "id" | "fullName" | "email" | "avatarUrl">;
  receiver: Pick<User, "id" | "fullName" | "email" | "avatarUrl">;
};

export interface TreeNode {
  id: string;
  fullName: string | null;
  email: string;
  status: string;
  avatarUrl: string | null;
  referralCount: number;
  totalEarnings: number;
  joinedAt: Date;
  children: TreeNode[];
  hasMore: boolean;
}

export interface DashboardStats {
  totalReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  availableBalance: number;
  totalWithdrawn: number;
  activeCampaigns: number;
  badgesEarned: number;
}

export interface AdminStats {
  totalPartners: number;
  activePartners: number;
  totalPurchases: number;
  totalPurchaseAmount: number;
  totalCommissions: number;
  totalCommissionAmount: number;
  pendingWithdrawals: number;
  pendingWithdrawalAmount: number;
}

export interface PartnerBalance {
  totalEarned: number;
  pendingEarnings: number;
  totalWithdrawn: number;
  pendingWithdrawals: number;
  availableBalance: number;
}
