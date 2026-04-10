import {
  LayoutDashboard,
  Network,
  DollarSign,
  Wallet,
  Trophy,
  Medal,
  Megaphone,
  GraduationCap,
  MessageSquare,
  Bell,
  Settings,
  Users,
  UserPlus,
  BadgeCheck,
  Upload,
  BookOpen,
} from "lucide-react";

export const PARTNER_NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "amber" },
  { label: "Network", href: "/network", icon: Network, color: "sky" },
  { label: "Earnings", href: "/earnings", icon: DollarSign, color: "emerald" },
  { label: "Withdrawals", href: "/withdrawals", icon: Wallet, color: "purple" },
  { label: "Campaigns", href: "/campaigns", icon: Trophy, color: "amber" },
  { label: "Leaderboard", href: "/leaderboard", icon: Medal, color: "amber" },
  { label: "Marketing", href: "/marketing", icon: Megaphone, color: "rose" },
  { label: "Training", href: "/training", icon: GraduationCap, color: "sky" },
  { label: "Messages", href: "/messages", icon: MessageSquare, color: "emerald" },
  { label: "Notifications", href: "/notifications", icon: Bell, color: "purple" },
  { label: "Settings", href: "/settings", icon: Settings, color: "slate" },
] as const;

export const ADMIN_NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Partners", href: "/admin/partners", icon: Users },
  { label: "Referrals", href: "/admin/purchases", icon: UserPlus },
  { label: "Commissions", href: "/admin/commissions", icon: DollarSign },
  { label: "Withdrawals", href: "/admin/withdrawals", icon: Wallet },
  { label: "Campaigns", href: "/admin/campaigns", icon: Trophy },
  { label: "Badges", href: "/admin/badges", icon: BadgeCheck },
  { label: "Marketing", href: "/admin/marketing", icon: Upload },
  { label: "Training", href: "/admin/training", icon: BookOpen },
  { label: "Messages", href: "/admin/messages", icon: MessageSquare },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export const BADGE_THRESHOLDS = [
  { name: "Bronze Network", threshold: 10, reward: 50 },
  { name: "Silver Network", threshold: 50, reward: 250 },
  { name: "Gold Network", threshold: 100, reward: 500 },
  { name: "Diamond Network", threshold: 300, reward: 2000 },
];

export const DEFAULT_COMMISSION_RATES = {
  level1: 6,
  level2: 3,
  level3Plus: 1,
};

export const MIN_WITHDRAWAL_DEFAULT = 50;
