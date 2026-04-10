"use client";

import { useState, useEffect } from "react";
import { type TreeNode as TreeNodeType } from "@/types";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

const depthColors = [
  "from-amber-400 to-amber-600 text-slate-900",
  "from-emerald-500 to-emerald-700 text-white",
  "from-sky-500 to-sky-700 text-white",
  "from-purple-500 to-purple-700 text-white",
];

interface TreeNodeProps {
  node: TreeNodeType;
  depth: number;
  onLoadMore: (nodeId: string) => Promise<TreeNodeType[]>;
  forceExpanded?: boolean;
}

export function TreeNode({ node, depth, onLoadMore, forceExpanded }: TreeNodeProps) {
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
          "bg-gradient-to-br rounded-lg shadow-lg px-4 py-3 min-w-[140px] text-center cursor-pointer transition-transform hover:scale-105",
          colorClass
        )}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        <div className="flex items-center justify-center gap-1">
          {hasChildren && (
            expanded
              ? <ChevronDown className="w-3 h-3" />
              : <ChevronRight className="w-3 h-3" />
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
                <TreeNode
                  node={child}
                  depth={depth + 1}
                  onLoadMore={onLoadMore}
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
            onClick={handleLoadMore}
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
