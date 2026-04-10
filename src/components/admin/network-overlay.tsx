"use client";

import { useState, useEffect, useCallback } from "react";
import { type TreeNode as TreeNodeType } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  Expand,
  Shrink,
  Loader2,
  X,
  Mail,
  Phone,
  Link,
  Calendar,
  Users,
  ShoppingCart,
} from "lucide-react";

// ─── User detail type ────────────────────────────────
interface UserDetail {
  id: string;
  fullName: string | null;
  email: string;
  phone: string | null;
  status: string;
  role: string;
  avatarUrl: string | null;
  pipzenReferralLink: string | null;
  createdAt: string;
  referrer: { id: string; fullName: string | null; email: string } | null;
  _count: { referrals: number; purchases: number; earnedCommissions: number };
  totalEarned: number;
  pendingEarnings: number;
  recentPurchases: {
    id: string;
    packageName: string;
    packageType: string;
    amount: string;
    createdAt: string;
  }[];
}

// ─── Depth colors ────────────────────────────────────
const depthColors = [
  "from-amber-400 to-amber-600 text-slate-900",
  "from-emerald-500 to-emerald-700 text-white",
  "from-sky-500 to-sky-700 text-white",
  "from-purple-500 to-purple-700 text-white",
];

// ─── AdminTreeNode (supports onClick for details) ────
function AdminTreeNode({
  node,
  depth,
  onLoadMore,
  onNodeClick,
  forceExpanded,
}: {
  node: TreeNodeType;
  depth: number;
  onLoadMore: (nodeId: string) => Promise<TreeNodeType[]>;
  onNodeClick: (nodeId: string) => void;
  forceExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const [children, setChildren] = useState(node.children);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (forceExpanded !== undefined) setExpanded(forceExpanded);
  }, [forceExpanded]);

  const hasChildren = children.length > 0 || node.hasMore;
  const colorClass = depthColors[Math.min(depth, depthColors.length - 1)];

  async function handleLoadMore() {
    setLoading(true);
    const loaded = await onLoadMore(node.id);
    setChildren(loaded);
    setExpanded(true);
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          "bg-gradient-to-br rounded-lg shadow-lg px-4 py-3 min-w-[140px] text-center cursor-pointer transition-transform hover:scale-105 relative group",
          colorClass
        )}
        onClick={(e) => {
          e.stopPropagation();
          onNodeClick(node.id);
        }}
      >
        <div className="flex items-center justify-center gap-1">
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="opacity-70 hover:opacity-100"
            >
              {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
          )}
          <p className="font-semibold text-sm truncate max-w-[120px]">
            {node.fullName || node.email.split("@")[0]}
          </p>
        </div>
        <p className="text-xs opacity-80 mt-1">{node.referralCount} referrals</p>
        <p className="text-xs opacity-80">{formatCurrency(node.totalEarnings)}</p>
      </div>

      {expanded && children.length > 0 && (
        <>
          <div className="w-0.5 h-6 bg-slate-600" />
          {children.length > 1 && (
            <div className="h-0.5 bg-slate-600" style={{ width: `${Math.min(children.length * 160, 800)}px` }} />
          )}
          <div className="flex gap-4 mt-1">
            {children.map((child) => (
              <div key={child.id} className="flex flex-col items-center">
                <div className="w-0.5 h-4 bg-slate-600" />
                <AdminTreeNode
                  node={child}
                  depth={depth + 1}
                  onLoadMore={onLoadMore}
                  onNodeClick={onNodeClick}
                  forceExpanded={forceExpanded}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {expanded && node.hasMore && children.length === 0 && (
        <>
          <div className="w-0.5 h-4 bg-slate-600" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLoadMore();
            }}
            disabled={loading}
            className="text-xs text-amber-400 hover:text-amber-300 bg-slate-800 border border-slate-700 rounded px-3 py-1"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Load more..."}
          </button>
        </>
      )}
    </div>
  );
}

// ─── User Detail Panel ────────────────────────────────
function UserDetailPanel({
  userDetail,
  loading,
  onClose,
}: {
  userDetail: UserDetail | null;
  loading: boolean;
  onClose: () => void;
}) {
  if (!userDetail && !loading) return null;

  return (
    <div className="w-80 border-l border-slate-700 bg-slate-900/80 p-4 overflow-y-auto flex-shrink-0">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-sm">User Details</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 text-slate-400 hover:text-white">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
        </div>
      )}

      {userDetail && !loading && (
        <div className="space-y-4">
          {/* Header */}
          <div className="text-center pb-3 border-b border-slate-700">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-900 font-bold text-lg mx-auto">
              {(userDetail.fullName || userDetail.email)[0].toUpperCase()}
            </div>
            <p className="text-white font-medium mt-2">{userDetail.fullName || "N/A"}</p>
            <p className="text-xs text-slate-400">{userDetail.email}</p>
            <div className="mt-2">
              <StatusBadge status={userDetail.status} />
            </div>
          </div>

          {/* Info rows */}
          <div className="space-y-2">
            {userDetail.phone && (
              <div className="flex items-center gap-2 text-xs">
                <Phone className="h-3 w-3 text-slate-500" />
                <span className="text-slate-300">{userDetail.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs">
              <Mail className="h-3 w-3 text-slate-500" />
              <span className="text-slate-300">{userDetail.email}</span>
            </div>
            {userDetail.pipzenReferralLink && (
              <div className="flex items-center gap-2 text-xs">
                <Link className="h-3 w-3 text-slate-500" />
                <span className="text-amber-400 truncate">{userDetail.pipzenReferralLink}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs">
              <Calendar className="h-3 w-3 text-slate-500" />
              <span className="text-slate-300">Joined {new Date(userDetail.createdAt).toLocaleDateString()}</span>
            </div>
            {userDetail.referrer && (
              <div className="flex items-center gap-2 text-xs">
                <Users className="h-3 w-3 text-slate-500" />
                <span className="text-slate-300">Referred by {userDetail.referrer.fullName || userDetail.referrer.email}</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-800 rounded-lg p-2 text-center">
              <p className="text-xs text-slate-400">Referrals</p>
              <p className="text-lg font-bold text-white">{userDetail._count.referrals}</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-2 text-center">
              <p className="text-xs text-slate-400">Purchases</p>
              <p className="text-lg font-bold text-white">{userDetail._count.purchases}</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-2 text-center">
              <p className="text-xs text-slate-400">Earned</p>
              <p className="text-sm font-bold text-emerald-400">{formatCurrency(userDetail.totalEarned)}</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-2 text-center">
              <p className="text-xs text-slate-400">Pending</p>
              <p className="text-sm font-bold text-amber-400">{formatCurrency(userDetail.pendingEarnings)}</p>
            </div>
          </div>

          {/* Recent Purchases */}
          {userDetail.recentPurchases.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                <ShoppingCart className="h-3 w-3" /> Recent Purchases
              </p>
              <div className="space-y-1.5">
                {userDetail.recentPurchases.map((p) => (
                  <div key={p.id} className="bg-slate-800 rounded p-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-300">{p.packageName}</span>
                      <span className="text-xs font-medium text-emerald-400">{formatCurrency(Number(p.amount))}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {p.packageType === "INSTANT_FUNDING" ? "Instant Funding" : "Evaluation"} &middot; {new Date(p.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Network Overlay ─────────────────────────────
interface NetworkOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId: string;
  partnerName: string;
}

export function NetworkOverlay({ open, onOpenChange, partnerId, partnerName }: NetworkOverlayProps) {
  const [tree, setTree] = useState<TreeNodeType | null>(null);
  const [treeLoading, setTreeLoading] = useState(false);
  const [allExpanded, setAllExpanded] = useState(false);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (open && partnerId) {
      setTree(null);
      setUserDetail(null);
      setTreeLoading(true);
      fetch(`/api/admin/network?userId=${partnerId}`)
        .then((res) => res.json())
        .then((data) => setTree(data))
        .catch(() => {})
        .finally(() => setTreeLoading(false));
    }
  }, [open, partnerId]);

  const loadMoreChildren = useCallback(async (nodeId: string): Promise<TreeNodeType[]> => {
    const res = await fetch(`/api/admin/network?nodeId=${nodeId}`);
    const data = await res.json();
    return data.children;
  }, []);

  function handleNodeClick(nodeId: string) {
    setDetailLoading(true);
    fetch(`/api/admin/network/user?userId=${nodeId}`)
      .then((res) => res.json())
      .then((data) => setUserDetail(data))
      .catch(() => {})
      .finally(() => setDetailLoading(false));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-[95vw] w-[95vw] h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-white">{partnerName}&apos;s Network</DialogTitle>
          <DialogDescription className="text-slate-400">
            Click any node to view details. Use the expand/collapse arrows to navigate the tree.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Tree area */}
          <div className="flex-1 overflow-auto p-6">
            <div className="flex items-center gap-2 mb-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAllExpanded(!allExpanded)}
                className="border-slate-700 text-slate-300"
              >
                {allExpanded ? <Shrink className="mr-2 h-4 w-4" /> : <Expand className="mr-2 h-4 w-4" />}
                {allExpanded ? "Collapse All" : "Expand All"}
              </Button>
              <div className="flex gap-3 ml-4">
                {[
                  { label: "Root", color: "from-amber-400 to-amber-600" },
                  { label: "Level 1 (6%)", color: "from-emerald-500 to-emerald-700" },
                  { label: "Level 2 (3%)", color: "from-sky-500 to-sky-700" },
                  { label: "Level 3+ (1%)", color: "from-purple-500 to-purple-700" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded bg-gradient-to-br ${item.color}`} />
                    <span className="text-xs text-slate-500">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {treeLoading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
              </div>
            )}

            {tree && !treeLoading && (
              <div className="min-w-fit">
                <AdminTreeNode
                  node={tree}
                  depth={0}
                  onLoadMore={loadMoreChildren}
                  onNodeClick={handleNodeClick}
                  forceExpanded={allExpanded}
                />
              </div>
            )}

            {!tree && !treeLoading && (
              <div className="text-center py-20 text-slate-500">
                No network data available.
              </div>
            )}
          </div>

          {/* Detail panel */}
          {(userDetail || detailLoading) && (
            <UserDetailPanel
              userDetail={userDetail}
              loading={detailLoading}
              onClose={() => setUserDetail(null)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
