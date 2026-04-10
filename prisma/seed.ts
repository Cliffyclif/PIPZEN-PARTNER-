import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash("Kingjay05%", 10);
  await prisma.user.upsert({
    where: { email: "obasijoseph114@gmail.com" },
    update: {
      passwordHash: adminPassword,
      role: "ADMIN",
      status: "ACTIVE",
      fullName: "PipZen Admin",
      profileCompleted: true,
    },
    create: {
      email: "obasijoseph114@gmail.com",
      passwordHash: adminPassword,
      role: "ADMIN",
      status: "ACTIVE",
      fullName: "PipZen Admin",
      profileCompleted: true,
      referralCode: "PZ-ADMIN",
    },
  });

  // Remove old placeholder admin if exists
  await prisma.user.deleteMany({ where: { email: "admin@pipzen.io" } });

  // Create default settings
  const defaultSettings = [
    { key: "commission_level_1", value: "6", label: "Level 1 Commission (%)", type: "number" },
    { key: "commission_level_2", value: "3", label: "Level 2 Commission (%)", type: "number" },
    { key: "commission_level_3_plus", value: "1", label: "Level 3+ Commission (%)", type: "number" },
    { key: "min_withdrawal", value: "50", label: "Minimum Withdrawal ($)", type: "number" },
    { key: "commission_auto_approve", value: "true", label: "Auto-approve Commissions", type: "boolean" },
  ];

  for (const s of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }

  // Create default badges
  const defaultBadges = [
    { name: "Bronze Network", referralThreshold: 10, rewardAmount: 50, description: "Reach 10 direct referrals" },
    { name: "Silver Network", referralThreshold: 50, rewardAmount: 250, description: "Reach 50 direct referrals" },
    { name: "Gold Network", referralThreshold: 100, rewardAmount: 500, description: "Reach 100 direct referrals" },
    { name: "Diamond Network", referralThreshold: 300, rewardAmount: 2000, description: "Reach 300 direct referrals" },
  ];

  for (const b of defaultBadges) {
    await prisma.badge.upsert({
      where: { referralThreshold: b.referralThreshold },
      update: {},
      create: b,
    });
  }

  console.log("Seed completed: admin user, settings, and badges created.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
