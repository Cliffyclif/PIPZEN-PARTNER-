"use client";

import { useState } from "react";
import { TreeNode } from "./tree-node";
import { type TreeNode as TreeNodeType } from "@/types";
import { Button } from "@/components/ui/button";
import { Expand, Shrink } from "lucide-react";

interface ReferralTreeProps {
  initialTree: TreeNodeType;
}

export function ReferralTree({ initialTree }: ReferralTreeProps) {
  const [tree] = useState(initialTree);
  const [allExpanded, setAllExpanded] = useState(false);

  async function loadMoreChildren(nodeId: string): Promise<TreeNodeType[]> {
    const res = await fetch(`/api/partner/network?nodeId=${nodeId}`);
    const data = await res.json();
    return data.children;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setAllExpanded(!allExpanded)}
          className="border-slate-700 text-slate-300"
        >
          {allExpanded ? <Shrink className="mr-2 h-4 w-4" /> : <Expand className="mr-2 h-4 w-4" />}
          {allExpanded ? "Collapse All" : "Expand All"}
        </Button>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 overflow-x-auto">
        <div className="min-w-fit">
          <TreeNode
            node={tree}
            depth={0}
            onLoadMore={loadMoreChildren}
            forceExpanded={allExpanded}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mt-4">
        {[
          { label: "You", color: "from-amber-400 to-amber-600" },
          { label: "Level 1 (6%)", color: "from-emerald-500 to-emerald-700" },
          { label: "Level 2 (3%)", color: "from-sky-500 to-sky-700" },
          { label: "Level 3+ (1%)", color: "from-purple-500 to-purple-700" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded bg-gradient-to-br ${item.color}`} />
            <span className="text-xs text-slate-400">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
