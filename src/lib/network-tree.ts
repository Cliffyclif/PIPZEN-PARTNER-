import { prisma } from "./prisma";
import { TreeNode } from "@/types";

export async function getNetworkTree(
  rootUserId: string,
  maxDepth: number = 3
): Promise<TreeNode> {
  const root = await prisma.user.findUnique({
    where: { id: rootUserId },
    select: {
      id: true,
      fullName: true,
      email: true,
      status: true,
      avatarUrl: true,
      createdAt: true,
    },
  });

  if (!root) throw new Error("User not found");

  const rootEarnings = await prisma.commission.aggregate({
    where: { earnerId: rootUserId, status: "PAID" },
    _sum: { commissionAmount: true },
  });

  const rootReferralCount = await prisma.user.count({
    where: { referrerId: rootUserId },
  });

  const children = await loadChildren(rootUserId, 0, maxDepth);

  return {
    id: root.id,
    fullName: root.fullName,
    email: root.email,
    status: root.status,
    avatarUrl: root.avatarUrl,
    referralCount: rootReferralCount,
    totalEarnings: Number(rootEarnings._sum.commissionAmount ?? 0),
    joinedAt: root.createdAt,
    children,
    hasMore: false,
  };
}

async function loadChildren(
  userId: string,
  depth: number,
  maxDepth: number
): Promise<TreeNode[]> {
  if (depth >= maxDepth) return [];

  const children = await prisma.user.findMany({
    where: { referrerId: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      status: true,
      avatarUrl: true,
      createdAt: true,
      _count: { select: { referrals: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return Promise.all(
    children.map(async (child) => {
      const earnings = await prisma.commission.aggregate({
        where: { earnerId: child.id, status: "PAID" },
        _sum: { commissionAmount: true },
      });

      const grandchildren = await loadChildren(child.id, depth + 1, maxDepth);
      const hasDeeper =
        depth + 1 >= maxDepth
          ? child._count.referrals > 0
          : false;

      return {
        id: child.id,
        fullName: child.fullName,
        email: child.email,
        status: child.status,
        avatarUrl: child.avatarUrl,
        referralCount: child._count.referrals,
        totalEarnings: Number(earnings._sum.commissionAmount ?? 0),
        joinedAt: child.createdAt,
        children: grandchildren,
        hasMore: hasDeeper,
      };
    })
  );
}

export async function getNodeChildren(
  nodeId: string,
  maxDepth: number = 2
): Promise<TreeNode[]> {
  return loadChildren(nodeId, 0, maxDepth);
}
