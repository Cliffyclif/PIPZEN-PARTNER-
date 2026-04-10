"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, useInView } from "framer-motion";

interface Node {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  level: number; // 0=root, 1=L1, 2=L2, 3=L3+
  parent: number | null;
  label: string;
  opacity: number;
  pulse: number;
}

interface Particle {
  fromId: number;
  toId: number;
  progress: number;
  speed: number;
  color: string;
}

const LEVEL_COLORS = [
  { fill: "#f59e0b", glow: "rgba(245, 158, 11, 0.4)", stroke: "#fbbf24" }, // amber - root
  { fill: "#10b981", glow: "rgba(16, 185, 129, 0.4)", stroke: "#34d399" }, // emerald - L1
  { fill: "#0ea5e9", glow: "rgba(14, 165, 233, 0.4)", stroke: "#38bdf8" }, // sky - L2
  { fill: "#8b5cf6", glow: "rgba(139, 92, 246, 0.4)", stroke: "#a78bfa" }, // purple - L3+
];

const NAMES = [
  "You", "Alex", "Sarah", "James", "Emma", "Mike", "Lisa", "David",
  "Maria", "John", "Amy", "Chris", "Nina", "Tom", "Kate", "Ryan",
  "Zoe", "Dan", "Mia", "Sam", "Lily", "Ben", "Eva", "Leo",
  "Ava", "Max", "Ivy", "Jay", "Ria", "Cole", "Sia", "Kai",
  "Lena", "Omar", "Tara", "Yuki", "Finn", "Noor", "Axel", "Luna",
];

function createNetwork(width: number, height: number): { nodes: Node[]; edges: [number, number][] } {
  const nodes: Node[] = [];
  const edges: [number, number][] = [];
  const centerX = width / 2;
  const centerY = height / 2;

  // Root node
  nodes.push({
    id: 0,
    x: centerX,
    y: centerY,
    vx: 0,
    vy: 0,
    radius: 22,
    level: 0,
    parent: null,
    label: NAMES[0],
    opacity: 1,
    pulse: 0,
  });

  let nodeCount = 1;
  const maxNodes = 40;

  // Level 1: 5-7 direct referrals
  const l1Count = 5 + Math.floor(Math.random() * 3);
  for (let i = 0; i < l1Count && nodeCount < maxNodes; i++) {
    const angle = (Math.PI * 2 * i) / l1Count + (Math.random() - 0.5) * 0.3;
    const dist = 120 + Math.random() * 40;
    nodes.push({
      id: nodeCount,
      x: centerX + Math.cos(angle) * dist,
      y: centerY + Math.sin(angle) * dist,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: 16,
      level: 1,
      parent: 0,
      label: NAMES[nodeCount % NAMES.length],
      opacity: 1,
      pulse: 0,
    });
    edges.push([0, nodeCount]);
    const parentL1 = nodeCount;
    nodeCount++;

    // Level 2: 2-4 per L1
    const l2Count = 2 + Math.floor(Math.random() * 3);
    for (let j = 0; j < l2Count && nodeCount < maxNodes; j++) {
      const a2 = angle + (j - l2Count / 2) * 0.4 + (Math.random() - 0.5) * 0.2;
      const d2 = dist + 90 + Math.random() * 30;
      nodes.push({
        id: nodeCount,
        x: centerX + Math.cos(a2) * d2,
        y: centerY + Math.sin(a2) * d2,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: 12,
        level: 2,
        parent: parentL1,
        label: NAMES[nodeCount % NAMES.length],
        opacity: 1,
        pulse: 0,
      });
      edges.push([parentL1, nodeCount]);
      const parentL2 = nodeCount;
      nodeCount++;

      // Level 3: 1-2 per L2
      const l3Count = Math.floor(Math.random() * 2) + 1;
      for (let k = 0; k < l3Count && nodeCount < maxNodes; k++) {
        const a3 = a2 + (k - l3Count / 2) * 0.5 + (Math.random() - 0.5) * 0.3;
        const d3 = d2 + 70 + Math.random() * 30;
        nodes.push({
          id: nodeCount,
          x: centerX + Math.cos(a3) * d3,
          y: centerY + Math.sin(a3) * d3,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          radius: 9,
          level: 3,
          parent: parentL2,
          label: NAMES[nodeCount % NAMES.length],
          opacity: 1,
          pulse: 0,
        });
        edges.push([parentL2, nodeCount]);
        nodeCount++;
      }
    }
  }

  return { nodes, edges };
}

export function NetworkVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: false, margin: "-100px" });
  const animRef = useRef<number>(0);
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<[number, number][]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const timeRef = useRef(0);
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 });

  const initNetwork = useCallback((w: number, h: number) => {
    const { nodes, edges } = createNetwork(w, h);
    nodesRef.current = nodes;
    edgesRef.current = edges;
    particlesRef.current = [];
  }, []);

  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const w = Math.min(rect.width, 1200);
        const h = 600;
        setDimensions({ width: w, height: h });
        initNetwork(w, h);
      }
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [initNetwork]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isInView) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    function handleMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
    function handleMouseLeave() {
      mouseRef.current = { x: -1000, y: -1000 };
    }
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    function spawnParticle() {
      const edges = edgesRef.current;
      if (edges.length === 0) return;
      // Pick a random edge and send a particle from child to parent (commission flow up)
      const edgeIdx = Math.floor(Math.random() * edges.length);
      const [from, to] = edges[edgeIdx];
      const fromNode = nodesRef.current.find((n) => n.id === to);
      const toNode = nodesRef.current.find((n) => n.id === from);
      if (!fromNode || !toNode) return;

      const color = LEVEL_COLORS[Math.min(fromNode.level, 3)].fill;
      particlesRef.current.push({
        fromId: to,
        toId: from,
        progress: 0,
        speed: 0.008 + Math.random() * 0.006,
        color,
      });
    }

    function animate() {
      if (!ctx) return;
      const { width, height } = dimensions;
      timeRef.current += 0.016;

      ctx.clearRect(0, 0, width, height);

      const nodes = nodesRef.current;
      const edges = edgesRef.current;
      const particles = particlesRef.current;
      const mouse = mouseRef.current;

      // Physics: gentle floating + mouse interaction
      for (const node of nodes) {
        // Gentle drift
        node.x += node.vx;
        node.y += node.vy;

        // Damping
        node.vx *= 0.995;
        node.vy *= 0.995;

        // Random perturbation
        node.vx += (Math.random() - 0.5) * 0.02;
        node.vy += (Math.random() - 0.5) * 0.02;

        // Mouse repulsion
        const dx = node.x - mouse.x;
        const dy = node.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120 && dist > 0) {
          const force = (120 - dist) / 120 * 0.5;
          node.vx += (dx / dist) * force;
          node.vy += (dy / dist) * force;
        }

        // Spring back toward original area (prevent drift)
        const cx = width / 2;
        const cy = height / 2;
        const fromCenter = Math.sqrt((node.x - cx) ** 2 + (node.y - cy) ** 2);
        const maxDist = Math.min(width, height) * 0.45;
        if (fromCenter > maxDist) {
          node.vx -= (node.x - cx) * 0.001;
          node.vy -= (node.y - cy) * 0.001;
        }

        // Keep in bounds
        if (node.x < node.radius + 20) { node.x = node.radius + 20; node.vx *= -0.5; }
        if (node.x > width - node.radius - 20) { node.x = width - node.radius - 20; node.vx *= -0.5; }
        if (node.y < node.radius + 20) { node.y = node.radius + 20; node.vy *= -0.5; }
        if (node.y > height - node.radius - 20) { node.y = height - node.radius - 20; node.vy *= -0.5; }

        // Pulse decay
        node.pulse = Math.max(0, node.pulse - 0.02);
      }

      // Draw edges
      for (const [fromId, toId] of edges) {
        const from = nodes.find((n) => n.id === fromId);
        const to = nodes.find((n) => n.id === toId);
        if (!from || !to) continue;

        const gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
        const fromColor = LEVEL_COLORS[Math.min(from.level, 3)];
        const toColor = LEVEL_COLORS[Math.min(to.level, 3)];
        gradient.addColorStop(0, fromColor.glow);
        gradient.addColorStop(1, toColor.glow);

        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.3;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Draw and update particles (commission flow)
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.progress += p.speed;

        if (p.progress >= 1) {
          // Pulse the target node
          const target = nodes.find((n) => n.id === p.toId);
          if (target) target.pulse = 1;
          particles.splice(i, 1);
          continue;
        }

        const from = nodes.find((n) => n.id === p.fromId);
        const to = nodes.find((n) => n.id === p.toId);
        if (!from || !to) { particles.splice(i, 1); continue; }

        const px = from.x + (to.x - from.x) * p.progress;
        const py = from.y + (to.y - from.y) * p.progress;

        // Trail
        for (let t = 0; t < 3; t++) {
          const tp = Math.max(0, p.progress - t * 0.03);
          const tx = from.x + (to.x - from.x) * tp;
          const ty = from.y + (to.y - from.y) * tp;
          ctx.beginPath();
          ctx.arc(tx, ty, 3 - t, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = (1 - t * 0.3) * 0.8;
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Glow
        ctx.beginPath();
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        const glow = ctx.createRadialGradient(px, py, 0, px, py, 8);
        glow.addColorStop(0, p.color);
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.globalAlpha = 0.5;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Draw nodes
      for (const node of nodes) {
        const colors = LEVEL_COLORS[Math.min(node.level, 3)];

        // Outer glow
        if (node.pulse > 0) {
          const glowSize = node.radius + 15 * node.pulse;
          ctx.beginPath();
          ctx.arc(node.x, node.y, glowSize, 0, Math.PI * 2);
          const grad = ctx.createRadialGradient(node.x, node.y, node.radius, node.x, node.y, glowSize);
          grad.addColorStop(0, colors.glow);
          grad.addColorStop(1, "transparent");
          ctx.fillStyle = grad;
          ctx.globalAlpha = node.pulse * 0.6;
          ctx.fill();
          ctx.globalAlpha = 1;
        }

        // Subtle breathing glow
        const breathe = Math.sin(timeRef.current * 2 + node.id) * 0.15 + 0.85;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 4, 0, Math.PI * 2);
        ctx.fillStyle = colors.glow;
        ctx.globalAlpha = 0.15 * breathe;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        const nodeGrad = ctx.createRadialGradient(
          node.x - node.radius * 0.3, node.y - node.radius * 0.3, 0,
          node.x, node.y, node.radius
        );
        nodeGrad.addColorStop(0, colors.stroke);
        nodeGrad.addColorStop(1, colors.fill);
        ctx.fillStyle = nodeGrad;
        ctx.fill();

        // Border
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.strokeStyle = colors.stroke;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Label
        if (node.radius >= 12) {
          ctx.font = `${node.level === 0 ? "bold " : ""}${Math.max(8, node.radius * 0.6)}px system-ui, sans-serif`;
          ctx.fillStyle = node.level === 0 ? "#0f172a" : "#ffffff";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(node.label, node.x, node.y);
        }
      }

      // Spawn particles periodically
      if (Math.random() < 0.03) spawnParticle();

      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [isInView, dimensions]);

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: dimensions.height }}>
      <canvas
        ref={canvasRef}
        style={{ width: dimensions.width, height: dimensions.height }}
        className="mx-auto cursor-crosshair"
      />
      {/* Fade edges */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-slate-950 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-slate-950 to-transparent" />
        <div className="absolute top-0 left-0 bottom-0 w-20 bg-gradient-to-r from-slate-950 to-transparent" />
        <div className="absolute top-0 right-0 bottom-0 w-20 bg-gradient-to-l from-slate-950 to-transparent" />
      </div>
    </div>
  );
}

// ─── Wrapper section with text ────────────────────────
export function NetworkShowcase() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
            </span>
            Live Network Simulation
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Watch Your Network{" "}
            <span className="bg-gradient-to-r from-purple-400 via-amber-400 to-emerald-400 bg-clip-text text-transparent">
              Come Alive
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            This is what a growing referral network looks like. Every glowing pulse is a commission flowing up through the tree.
            The deeper it grows, the more everyone earns.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative rounded-2xl border border-slate-800 bg-slate-950/50 overflow-hidden"
        >
          <NetworkVisualization />

          {/* Overlay legend */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-wrap items-center justify-center gap-4 bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-full px-6 py-2.5">
            {[
              { label: "You (Root)", color: "bg-amber-400" },
              { label: "Level 1 — 6%", color: "bg-emerald-400" },
              { label: "Level 2 — 3%", color: "bg-sky-400" },
              { label: "Level 3+ — 1%", color: "bg-purple-400" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                <span className="text-xs text-slate-400">{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Stats below visualization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mt-8"
        >
          {[
            { label: "Nodes in Network", value: "40+", icon: "text-amber-400" },
            { label: "Commission Levels", value: "Unlimited", icon: "text-emerald-400" },
            { label: "Earnings Flow", value: "Real-Time", icon: "text-purple-400" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className={`text-xl sm:text-2xl font-bold ${stat.icon}`}>{stat.value}</p>
              <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
