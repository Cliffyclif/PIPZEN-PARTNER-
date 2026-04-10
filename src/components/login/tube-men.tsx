"use client";

import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";

export type TubeManMood =
  | "idle"
  | "watching"
  | "hiding"
  | "error"
  | "success";

interface TubeMenProps {
  mood: TubeManMood;
}

// ─── Single Realistic Tube Man (SVG) ─────────────────
function TubeMan({
  color,
  scale,
  delay,
  mood,
  flip,
}: {
  color: string;
  scale: number;
  delay: number;
  mood: TubeManMood;
  flip?: boolean;
}) {
  const bodyControls = useAnimation();
  const leftArmControls = useAnimation();
  const rightArmControls = useAnimation();
  const hairControls = useAnimation();

  const colorMap: Record<string, { body: string; light: string; dark: string; outline: string }> = {
    red:     { body: "#ef4444", light: "#f87171", dark: "#b91c1c", outline: "#991b1b" },
    amber:   { body: "#f59e0b", light: "#fbbf24", dark: "#d97706", outline: "#92400e" },
    emerald: { body: "#10b981", light: "#34d399", dark: "#059669", outline: "#065f46" },
    sky:     { body: "#0ea5e9", light: "#38bdf8", dark: "#0284c7", outline: "#075985" },
  };

  const c = colorMap[color] || colorMap.red;

  useEffect(() => {
    async function animate() {
      switch (mood) {
        case "idle":
          bodyControls.start({
            d: [
              // Upright with slight sway
              "M 45 60 Q 42 120 40 180 Q 38 220 42 260 L 58 260 Q 62 220 60 180 Q 58 120 55 60 Z",
              // Lean left
              "M 45 60 Q 35 120 32 180 Q 30 220 38 260 L 62 260 Q 64 220 58 180 Q 52 120 55 60 Z",
              // Back upright
              "M 45 60 Q 42 120 40 180 Q 38 220 42 260 L 58 260 Q 62 220 60 180 Q 58 120 55 60 Z",
              // Lean right
              "M 45 60 Q 55 120 62 180 Q 64 220 62 260 L 38 260 Q 36 220 42 180 Q 48 120 55 60 Z",
              // Back upright
              "M 45 60 Q 42 120 40 180 Q 38 220 42 260 L 58 260 Q 62 220 60 180 Q 58 120 55 60 Z",
            ],
            transition: { duration: 3, repeat: Infinity, ease: "easeInOut", delay },
          });
          leftArmControls.start({
            d: [
              "M 42 85 Q 20 70 5 50 Q -2 42 2 35",
              "M 42 85 Q 15 95 -5 80 Q -12 72 -8 65",
              "M 42 85 Q 10 60 -10 35 Q -15 28 -10 22",
              "M 42 85 Q 25 75 10 55 Q 5 48 8 40",
              "M 42 85 Q 20 70 5 50 Q -2 42 2 35",
            ],
            transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut", delay },
          });
          rightArmControls.start({
            d: [
              "M 58 85 Q 80 70 95 50 Q 102 42 98 35",
              "M 58 85 Q 85 75 100 55 Q 105 48 102 40",
              "M 58 85 Q 90 95 105 80 Q 112 72 108 65",
              "M 58 85 Q 75 60 90 35 Q 95 28 92 22",
              "M 58 85 Q 80 70 95 50 Q 102 42 98 35",
            ],
            transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: delay + 0.4 },
          });
          hairControls.start({
            d: [
              "M 46 20 Q 44 5 40 -5  M 50 18 Q 50 0 52 -8  M 54 20 Q 58 5 62 -5  M 48 19 Q 42 2 38 -8  M 52 19 Q 56 0 60 -10",
              "M 46 20 Q 38 8 32 0  M 50 18 Q 44 3 40 -5  M 54 20 Q 50 5 48 -3  M 48 19 Q 36 5 30 -2  M 52 19 Q 48 3 44 -7",
              "M 46 20 Q 44 5 40 -5  M 50 18 Q 50 0 52 -8  M 54 20 Q 58 5 62 -5  M 48 19 Q 42 2 38 -8  M 52 19 Q 56 0 60 -10",
              "M 46 20 Q 52 8 58 0  M 50 18 Q 56 3 60 -5  M 54 20 Q 62 5 68 -3  M 48 19 Q 54 5 60 -2  M 52 19 Q 60 3 66 -7",
              "M 46 20 Q 44 5 40 -5  M 50 18 Q 50 0 52 -8  M 54 20 Q 58 5 62 -5  M 48 19 Q 42 2 38 -8  M 52 19 Q 56 0 60 -10",
            ],
            transition: { duration: 2.2, repeat: Infinity, ease: "easeInOut", delay },
          });
          break;

        case "watching":
          bodyControls.start({
            d: flip
              ? "M 45 60 Q 50 120 55 180 Q 57 220 55 260 L 45 260 Q 43 220 45 180 Q 47 120 55 60 Z"
              : "M 45 60 Q 40 120 35 180 Q 33 220 35 260 L 65 260 Q 67 220 65 180 Q 60 120 55 60 Z",
            transition: { duration: 0.5, ease: "easeOut" },
          });
          leftArmControls.start({
            d: "M 42 85 Q 28 95 18 100 Q 12 104 15 108",
            transition: { duration: 0.4 },
          });
          rightArmControls.start({
            d: "M 58 85 Q 72 95 82 100 Q 88 104 85 108",
            transition: { duration: 0.4 },
          });
          hairControls.start({
            d: flip
              ? "M 46 20 Q 52 6 58 -2  M 50 18 Q 56 2 62 -5  M 54 20 Q 60 6 66 -2  M 48 19 Q 54 4 60 -4  M 52 19 Q 58 2 64 -6"
              : "M 46 20 Q 38 6 32 -2  M 50 18 Q 44 2 38 -5  M 54 20 Q 48 6 42 -2  M 48 19 Q 40 4 34 -4  M 52 19 Q 46 2 40 -6",
            transition: { duration: 0.4 },
          });
          break;

        case "hiding":
          bodyControls.start({
            d: "M 45 60 Q 42 120 40 180 Q 38 220 42 260 L 58 260 Q 62 220 60 180 Q 58 120 55 60 Z",
            transition: { duration: 0.3 },
          });
          leftArmControls.start({
            d: [
              "M 42 85 Q 38 70 42 52 Q 44 44 48 42",
              "M 42 85 Q 36 68 40 50 Q 42 42 46 40",
              "M 42 85 Q 38 70 42 52 Q 44 44 48 42",
            ],
            transition: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
          });
          rightArmControls.start({
            d: [
              "M 58 85 Q 62 70 58 52 Q 56 44 52 42",
              "M 58 85 Q 64 68 60 50 Q 58 42 54 40",
              "M 58 85 Q 62 70 58 52 Q 56 44 52 42",
            ],
            transition: { duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.15 },
          });
          hairControls.start({
            d: "M 46 20 Q 44 5 40 -5  M 50 18 Q 50 0 52 -8  M 54 20 Q 58 5 62 -5  M 48 19 Q 42 2 38 -8  M 52 19 Q 56 0 60 -10",
            transition: { duration: 0.3 },
          });
          break;

        case "error":
          bodyControls.start({
            d: [
              "M 45 60 Q 42 120 40 180 Q 38 220 42 260 L 58 260 Q 62 220 60 180 Q 58 120 55 60 Z",
              "M 45 60 Q 35 115 30 175 Q 28 215 38 260 L 62 260 Q 72 215 70 175 Q 65 115 55 60 Z",
              "M 45 60 Q 55 115 60 175 Q 62 215 58 260 L 42 260 Q 38 215 40 175 Q 45 115 55 60 Z",
              "M 45 60 Q 35 115 30 175 Q 28 215 38 260 L 62 260 Q 72 215 70 175 Q 65 115 55 60 Z",
              "M 45 60 Q 42 120 40 180 Q 38 220 42 260 L 58 260 Q 62 220 60 180 Q 58 120 55 60 Z",
            ],
            transition: { duration: 0.6, repeat: 2 },
          });
          leftArmControls.start({
            d: [
              "M 42 85 Q 15 60 -5 40 Q -12 32 -8 25",
              "M 42 85 Q 25 100 10 110 Q 2 115 5 120",
              "M 42 85 Q 15 60 -5 40 Q -12 32 -8 25",
              "M 42 85 Q 25 100 10 110 Q 2 115 5 120",
              "M 42 85 Q 20 70 5 50 Q -2 42 2 35",
            ],
            transition: { duration: 0.5, repeat: 2 },
          });
          rightArmControls.start({
            d: [
              "M 58 85 Q 85 60 105 40 Q 112 32 108 25",
              "M 58 85 Q 75 100 90 110 Q 98 115 95 120",
              "M 58 85 Q 85 60 105 40 Q 112 32 108 25",
              "M 58 85 Q 75 100 90 110 Q 98 115 95 120",
              "M 58 85 Q 80 70 95 50 Q 102 42 98 35",
            ],
            transition: { duration: 0.5, repeat: 2 },
          });
          hairControls.start({
            d: [
              "M 46 20 Q 38 2 30 -8  M 50 18 Q 42 -2 36 -10  M 54 20 Q 48 2 42 -8  M 48 19 Q 34 0 26 -8  M 52 19 Q 44 -2 38 -12",
              "M 46 20 Q 56 2 64 -8  M 50 18 Q 58 -2 66 -10  M 54 20 Q 62 2 70 -8  M 48 19 Q 58 0 66 -8  M 52 19 Q 62 -2 70 -12",
              "M 46 20 Q 38 2 30 -8  M 50 18 Q 42 -2 36 -10  M 54 20 Q 48 2 42 -8  M 48 19 Q 34 0 26 -8  M 52 19 Q 44 -2 38 -12",
            ],
            transition: { duration: 0.4, repeat: 3 },
          });
          break;

        case "success":
          bodyControls.start({
            d: [
              "M 45 60 Q 42 120 40 180 Q 38 220 42 260 L 58 260 Q 62 220 60 180 Q 58 120 55 60 Z",
              "M 45 50 Q 40 110 38 170 Q 36 210 40 250 L 60 250 Q 64 210 62 170 Q 60 110 55 50 Z",
              "M 45 60 Q 42 120 40 180 Q 38 220 42 260 L 58 260 Q 62 220 60 180 Q 58 120 55 60 Z",
              "M 45 50 Q 40 110 38 170 Q 36 210 40 250 L 60 250 Q 64 210 62 170 Q 60 110 55 50 Z",
              "M 45 60 Q 42 120 40 180 Q 38 220 42 260 L 58 260 Q 62 220 60 180 Q 58 120 55 60 Z",
            ],
            transition: { duration: 0.6, repeat: Infinity },
          });
          leftArmControls.start({
            d: [
              "M 42 85 Q 18 55 -5 25 Q -12 15 -8 8",
              "M 42 85 Q 12 50 -15 15 Q -22 5 -18 -2",
              "M 42 85 Q 18 55 -5 25 Q -12 15 -8 8",
            ],
            transition: { duration: 0.5, repeat: Infinity },
          });
          rightArmControls.start({
            d: [
              "M 58 85 Q 82 55 105 25 Q 112 15 108 8",
              "M 58 85 Q 88 50 115 15 Q 122 5 118 -2",
              "M 58 85 Q 82 55 105 25 Q 112 15 108 8",
            ],
            transition: { duration: 0.5, repeat: Infinity, delay: 0.1 },
          });
          hairControls.start({
            d: [
              "M 46 20 Q 40 -2 34 -15  M 50 18 Q 48 -5 46 -18  M 54 20 Q 60 -2 66 -15  M 48 19 Q 36 -2 28 -15  M 52 19 Q 62 -2 70 -18",
              "M 46 20 Q 44 5 40 -5  M 50 18 Q 50 0 52 -8  M 54 20 Q 58 5 62 -5  M 48 19 Q 42 2 38 -8  M 52 19 Q 56 0 60 -10",
              "M 46 20 Q 40 -2 34 -15  M 50 18 Q 48 -5 46 -18  M 54 20 Q 60 -2 66 -15  M 48 19 Q 36 -2 28 -15  M 52 19 Q 62 -2 70 -18",
            ],
            transition: { duration: 0.4, repeat: Infinity },
          });
          break;
      }
    }
    animate();
  }, [mood, bodyControls, leftArmControls, rightArmControls, hairControls, delay, flip]);

  // Face rendering on the body
  function renderFace() {
    switch (mood) {
      case "idle":
      case "watching":
        return (
          <>
            {/* Eyes */}
            <ellipse cx={44} cy={80} rx={4} ry={4.5} fill="white" />
            <ellipse cx={56} cy={80} rx={4} ry={4.5} fill="white" />
            <motion.circle
              cx={44} cy={80} r={2.5}
              fill="#1e293b"
              animate={mood === "watching" ? { cx: flip ? 42 : 46, cy: 82 } : { cx: 44, cy: 80 }}
              transition={{ duration: 0.3 }}
            />
            <motion.circle
              cx={56} cy={80} r={2.5}
              fill="#1e293b"
              animate={mood === "watching" ? { cx: flip ? 54 : 58, cy: 82 } : { cx: 56, cy: 80 }}
              transition={{ duration: 0.3 }}
            />
            {/* Smile */}
            <path
              d="M 42 92 Q 50 102 58 92"
              fill="none"
              stroke="#1e293b"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </>
        );

      case "hiding":
        return (
          <>
            {/* Squeezed shut eyes — X marks */}
            <line x1={40} y1={77} x2={48} y2={83} stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
            <line x1={48} y1={77} x2={40} y2={83} stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
            <line x1={52} y1={77} x2={60} y2={83} stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
            <line x1={60} y1={77} x2={52} y2={83} stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
            {/* Small O mouth */}
            <ellipse cx={50} cy={95} rx={4} ry={3.5} fill="#1e293b" opacity={0.7} />
          </>
        );

      case "error":
        return (
          <>
            {/* Wide shocked eyes */}
            <ellipse cx={44} cy={78} rx={5} ry={5.5} fill="white" />
            <ellipse cx={56} cy={78} rx={5} ry={5.5} fill="white" />
            <circle cx={44} cy={78} r={3} fill="#1e293b" />
            <circle cx={56} cy={78} r={3} fill="#1e293b" />
            {/* Teeth / grimace */}
            <rect x={40} y={90} width={20} height={10} rx={3} fill="white" stroke="#1e293b" strokeWidth="1.5" />
            <line x1={45} y1={90} x2={45} y2={100} stroke="#1e293b" strokeWidth="1" />
            <line x1={50} y1={90} x2={50} y2={100} stroke="#1e293b" strokeWidth="1" />
            <line x1={55} y1={90} x2={55} y2={100} stroke="#1e293b" strokeWidth="1" />
            <line x1={40} y1={95} x2={60} y2={95} stroke="#1e293b" strokeWidth="1" />
          </>
        );

      case "success":
        return (
          <>
            {/* Happy squinty eyes */}
            <path d="M 39 80 Q 44 74 49 80" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 51 80 Q 56 74 61 80" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
            {/* Big open smile */}
            <path d="M 40 90 Q 50 106 60 90" fill="#1e293b" stroke="#1e293b" strokeWidth="1.5" />
            <ellipse cx={50} cy={98} rx={5} ry={3} fill="#f87171" />
          </>
        );

      default:
        return null;
    }
  }

  return (
    <div
      className="flex-shrink-0"
      style={{ transform: `scale(${scale})${flip ? " scaleX(-1)" : ""}`, transformOrigin: "bottom center" }}
    >
      <svg
        width={100}
        height={300}
        viewBox="-20 -20 140 320"
        style={{ overflow: "visible" }}
      >
        {/* Hair tendrils */}
        <motion.path
          animate={hairControls}
          d="M 46 20 Q 44 5 40 -5  M 50 18 Q 50 0 52 -8  M 54 20 Q 58 5 62 -5  M 48 19 Q 42 2 38 -8  M 52 19 Q 56 0 60 -10"
          fill="none"
          stroke={c.dark}
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Head - rounded top of tube */}
        <ellipse cx={50} cy={42} rx={16} ry={22} fill={c.body} stroke={c.outline} strokeWidth="2" />
        {/* Head highlight */}
        <ellipse cx={46} cy={36} rx={6} ry={10} fill={c.light} opacity={0.4} />

        {/* Body - tall inflatable tube shape */}
        <motion.path
          animate={bodyControls}
          d="M 45 60 Q 42 120 40 180 Q 38 220 42 260 L 58 260 Q 62 220 60 180 Q 58 120 55 60 Z"
          fill={c.body}
          stroke={c.outline}
          strokeWidth="2"
        />
        {/* Body highlight stripe */}
        <motion.path
          animate={bodyControls}
          d="M 45 60 Q 42 120 40 180 Q 38 220 42 260 L 58 260 Q 62 220 60 180 Q 58 120 55 60 Z"
          fill={c.light}
          opacity={0.25}
          clipPath="inset(0 40% 0 0)"
        />

        {/* Left arm - long floppy noodle */}
        <motion.path
          animate={leftArmControls}
          d="M 42 85 Q 20 70 5 50 Q -2 42 2 35"
          fill="none"
          stroke={c.body}
          strokeWidth="10"
          strokeLinecap="round"
        />
        <motion.path
          animate={leftArmControls}
          d="M 42 85 Q 20 70 5 50 Q -2 42 2 35"
          fill="none"
          stroke={c.outline}
          strokeWidth="12"
          strokeLinecap="round"
          opacity={0.15}
        />

        {/* Right arm - long floppy noodle */}
        <motion.path
          animate={rightArmControls}
          d="M 58 85 Q 80 70 95 50 Q 102 42 98 35"
          fill="none"
          stroke={c.body}
          strokeWidth="10"
          strokeLinecap="round"
        />
        <motion.path
          animate={rightArmControls}
          d="M 58 85 Q 80 70 95 50 Q 102 42 98 35"
          fill="none"
          stroke={c.outline}
          strokeWidth="12"
          strokeLinecap="round"
          opacity={0.15}
        />

        {/* Face on the body (unflip if parent is flipped) */}
        <g style={{ transform: flip ? "scaleX(-1) translateX(-100px)" : undefined }}>
          {renderFace()}
        </g>

        {/* Blower base */}
        <ellipse cx={50} cy={264} rx={24} ry={6} fill="#475569" />
        <rect x={30} y={260} width={40} height={16} rx={4} fill="#64748b" stroke="#475569" strokeWidth="1.5" />
        <ellipse cx={50} cy={276} rx={22} ry={5} fill="#475569" />
        {/* Base highlight */}
        <rect x={36} y={262} width={12} height={4} rx={2} fill="#94a3b8" opacity={0.4} />
      </svg>
    </div>
  );
}

// ─── Three tube men group (one side) ─────────────────
export function TubeMenGroup({ mood }: TubeMenProps) {
  return (
    <>
      {/* Desktop: 3 tube men side by side, different heights */}
      <div className="hidden lg:flex items-end gap-0 -mr-4">
        <TubeMan color="emerald" scale={0.75} delay={0} mood={mood} flip={false} />
        <TubeMan color="red" scale={1.05} delay={0.2} mood={mood} flip={false} />
        <TubeMan color="amber" scale={0.6} delay={0.4} mood={mood} flip={false} />
      </div>

      {/* Mobile: single tube man above */}
      <div className="flex lg:hidden items-end justify-center mb-4">
        <TubeMan color="red" scale={0.6} delay={0.1} mood={mood} flip={false} />
      </div>
    </>
  );
}
