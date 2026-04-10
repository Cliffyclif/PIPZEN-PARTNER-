"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

// ─── Tree node component ─────────────────────────────
function TreeNode({
  label,
  sublabel,
  gradient,
  textColor,
  delay,
  size = "md",
}: {
  label: string;
  sublabel: string;
  gradient: string;
  textColor: string;
  delay: number;
  size?: "lg" | "md" | "sm" | "xs";
}) {
  const sizes = {
    lg: "px-6 py-3 rounded-xl min-w-[140px]",
    md: "px-4 py-2.5 rounded-lg min-w-[100px]",
    sm: "px-3 py-2 rounded-lg min-w-[70px]",
    xs: "px-2 py-1.5 rounded-md min-w-[52px]",
  };

  const textSizes = {
    lg: "text-sm font-bold",
    md: "text-xs font-semibold",
    sm: "text-[11px] font-semibold",
    xs: "text-[10px] font-semibold",
  };

  const subTextSizes = {
    lg: "text-xs mt-1",
    md: "text-[10px] mt-0.5",
    sm: "text-[9px] mt-0.5",
    xs: "text-[8px]",
  };

  return (
    <motion.div
      className={`bg-gradient-to-br ${gradient} text-white ${sizes[size]} shadow-lg text-center`}
      initial={{ scale: 0, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
        delay,
      }}
    >
      <div className={textSizes[size]}>{label}</div>
      <div className={`${textColor} ${subTextSizes[size]} font-medium`}>{sublabel}</div>
    </motion.div>
  );
}

// ─── Animated vertical connector ─────────────────────
function VConnector({ height = 24, delay }: { height?: number; delay: number }) {
  return (
    <motion.div
      className="w-0.5 bg-slate-600 mx-auto"
      style={{ height }}
      initial={{ scaleY: 0, originY: 0 }}
      whileInView={{ scaleY: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay }}
    />
  );
}

// ─── Animated horizontal connector ───────────────────
function HConnector({ delay, className = "" }: { delay: number; className?: string }) {
  return (
    <motion.div
      className={`h-0.5 bg-slate-600 ${className}`}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
    />
  );
}

// ─── Level 3 group (3 purple nodes under a sky node) ─
function Level3Group({
  parentIndex,
  childIndex,
  baseDelay,
}: {
  parentIndex: number;
  childIndex: number;
  baseDelay: number;
}) {
  const children = 3;
  return (
    <div className="flex flex-col items-center">
      <VConnector height={16} delay={baseDelay} />
      <TreeNode
        label={`${parentIndex + 1}.${childIndex + 1}`}
        sublabel="3%"
        gradient="from-sky-500 to-sky-700"
        textColor="text-sky-200"
        delay={baseDelay + 0.05}
        size="sm"
      />
      <VConnector height={12} delay={baseDelay + 0.15} />
      <HConnector delay={baseDelay + 0.2} className="w-16" />
      <div className="flex gap-1">
        {Array.from({ length: children }, (_, k) => (
          <div key={k} className="flex flex-col items-center">
            <VConnector height={10} delay={baseDelay + 0.25 + k * 0.05} />
            <TreeNode
              label={`${parentIndex + 1}.${childIndex + 1}.${k + 1}`}
              sublabel="1%"
              gradient="from-purple-500 to-purple-700"
              textColor="text-purple-200"
              delay={baseDelay + 0.3 + k * 0.05}
              size="xs"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Level 2 group (emerald node with sky children) ──
function Level2Group({
  index,
  baseDelay,
  childCount,
}: {
  index: number;
  baseDelay: number;
  childCount: number;
}) {
  return (
    <div className="flex flex-col items-center">
      <VConnector height={20} delay={baseDelay} />
      <TreeNode
        label={`Person ${index + 1}`}
        sublabel="6%"
        gradient="from-emerald-500 to-emerald-700"
        textColor="text-emerald-200"
        delay={baseDelay + 0.05}
        size="md"
      />
      <VConnector height={16} delay={baseDelay + 0.15} />
      <HConnector delay={baseDelay + 0.2} className="w-20" />
      <div className="flex gap-1.5">
        {Array.from({ length: childCount }, (_, j) => (
          <Level3Group
            key={j}
            parentIndex={index}
            childIndex={j}
            baseDelay={baseDelay + 0.25 + j * 0.15}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Referral Tree Visual ───────────────────────
export function ReferralTreeVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  // 5 direct referrals for the animated version (compact but clear)
  const level2Config = [
    { childCount: 3 },
    { childCount: 2 },
    { childCount: 3 },
    { childCount: 2 },
    { childCount: 3 },
  ];

  return (
    <section className="py-24 bg-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium mb-4">
            Referral Structure
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Your Network,{" "}
            <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              Visualized
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            See how commissions flow through three levels of referrals. Every purchase in your network earns you money.
          </p>
        </motion.div>

        {/* Tree container with horizontal scroll on mobile */}
        <div className="overflow-x-auto pb-4">
          <div ref={ref} className="min-w-[1000px] relative">
            {/* Master Referee */}
            <div className="flex justify-center mb-1">
              <TreeNode
                label="You (Partner)"
                sublabel="Master Referee"
                gradient="from-amber-400 to-amber-600"
                textColor="text-amber-900"
                delay={0}
                size="lg"
              />
            </div>

            {/* Connector from Master to horizontal line */}
            <VConnector height={28} delay={0.3} />

            {/* Horizontal line spanning Level 2 */}
            <div className="flex justify-center">
              <HConnector delay={0.4} className="w-[85%]" />
            </div>

            {/* Level 2 groups */}
            <div className="flex justify-center gap-3">
              {level2Config.map((config, i) => (
                <Level2Group
                  key={i}
                  index={i}
                  baseDelay={0.5 + i * 0.2}
                  childCount={config.childCount}
                />
              ))}
            </div>

            {/* Floating commission amounts */}
            {isInView && (
              <>
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute text-emerald-400 text-xs font-bold pointer-events-none"
                    style={{
                      left: `${15 + i * 17}%`,
                      top: "15%",
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: [0, 1, 1, 0],
                      y: [20, 0, -10, -30],
                    }}
                    transition={{
                      duration: 2.5,
                      delay: 3 + i * 0.8,
                      repeat: Infinity,
                      repeatDelay: 5,
                    }}
                  >
                    +$
                  </motion.div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Legend */}
        <motion.div
          className="flex justify-center mt-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 2 }}
        >
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-5 shadow-lg border border-slate-700/50">
            <h3 className="text-white font-semibold mb-3 text-center text-sm">Commission Structure</h3>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded bg-gradient-to-br from-amber-400 to-amber-600" />
                <span className="text-slate-300 text-xs">You (Partner)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded bg-gradient-to-br from-emerald-500 to-emerald-700" />
                <span className="text-slate-300 text-xs">Level 1 — Direct Referrals — <span className="text-emerald-400 font-semibold">6%</span></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded bg-gradient-to-br from-sky-500 to-sky-700" />
                <span className="text-slate-300 text-xs">Level 2 — Sub-Referrals — <span className="text-sky-400 font-semibold">3%</span></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded bg-gradient-to-br from-purple-500 to-purple-700" />
                <span className="text-slate-300 text-xs">Level 3 — Tier 3 Referrals — <span className="text-purple-400 font-semibold">1%</span></span>
              </div>
            </div>

            {/* Earnings summary */}
            <div className="mt-4 pt-3 border-t border-slate-700/50">
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-xs">
                <span className="text-slate-400">
                  Example with $500 purchase:
                </span>
                <span className="text-emerald-400 font-medium">L1: $30 (6%)</span>
                <span className="text-sky-400 font-medium">L2: $15 (3%)</span>
                <span className="text-purple-400 font-medium">L3: $5 (1%)</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
