"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView, useMotionValue, useTransform, useSpring } from "framer-motion";

// ─── Fade-in on scroll ────────────────────────────────
export function FadeIn({
  children,
  delay = 0,
  direction = "up",
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const directionOffset = {
    up: { y: 40, x: 0 },
    down: { y: -40, x: 0 },
    left: { x: 40, y: 0 },
    right: { x: -40, y: 0 },
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...directionOffset[direction] }}
      animate={isInView ? { opacity: 1, y: 0, x: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Animated counter ─────────────────────────────────
export function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  duration = 2,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { duration: duration * 1000 });
  const display = useTransform(springValue, (v) => `${prefix}${Math.round(v).toLocaleString()}${suffix}`);

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue]);

  return <motion.span ref={ref}>{display}</motion.span>;
}

// ─── 3D Tilt Card ─────────────────────────────────────
export function TiltCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setRotateX(-y * 20);
    setRotateY(x * 20);
  }

  function handleMouseLeave() {
    setRotateX(0);
    setRotateY(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ rotateX, rotateY }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{ perspective: 1000, transformStyle: "preserve-3d" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Floating 3D Object ───────────────────────────────
export function FloatingOrb({
  size = 200,
  color = "amber",
  delay = 0,
  className = "",
}: {
  size?: number;
  color?: "amber" | "emerald" | "sky" | "purple";
  delay?: number;
  className?: string;
}) {
  const colors = {
    amber: "from-amber-400/30 to-amber-600/10",
    emerald: "from-emerald-400/30 to-emerald-600/10",
    sky: "from-sky-400/30 to-sky-600/10",
    purple: "from-purple-400/30 to-purple-600/10",
  };

  return (
    <motion.div
      className={`absolute rounded-full bg-gradient-to-br ${colors[color]} blur-xl ${className}`}
      style={{ width: size, height: size }}
      animate={{
        y: [0, -30, 0, 30, 0],
        x: [0, 20, 0, -20, 0],
        scale: [1, 1.1, 1, 0.9, 1],
        rotate: [0, 90, 180, 270, 360],
      }}
      transition={{
        duration: 20,
        delay,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );
}

// ─── Spinning 3D Cube ─────────────────────────────────
export function SpinningCube({ size = 60, className = "" }: { size?: number; className?: string }) {
  return (
    <div className={`${className}`} style={{ perspective: 600 }}>
      <motion.div
        style={{
          width: size,
          height: size,
          transformStyle: "preserve-3d",
        }}
        animate={{
          rotateX: [0, 360],
          rotateY: [0, 360],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {[
          { transform: `translateZ(${size / 2}px)` },
          { transform: `rotateY(180deg) translateZ(${size / 2}px)` },
          { transform: `rotateY(90deg) translateZ(${size / 2}px)` },
          { transform: `rotateY(-90deg) translateZ(${size / 2}px)` },
          { transform: `rotateX(90deg) translateZ(${size / 2}px)` },
          { transform: `rotateX(-90deg) translateZ(${size / 2}px)` },
        ].map((face, i) => (
          <div
            key={i}
            className="absolute inset-0 border border-amber-500/30 bg-amber-500/5 rounded-lg"
            style={{ ...face, backfaceVisibility: "hidden" }}
          />
        ))}
      </motion.div>
    </div>
  );
}

// ─── Orbiting Particles ───────────────────────────────
export function OrbitingParticles({ className = "" }: { className?: string }) {
  const particles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    size: 4 + Math.random() * 6,
    radius: 80 + i * 30,
    duration: 10 + i * 3,
    delay: i * 0.5,
    color: ["bg-amber-400", "bg-emerald-400", "bg-sky-400", "bg-purple-400"][i % 4],
  }));

  return (
    <div className={`relative ${className}`} style={{ perspective: 800 }}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className={`absolute rounded-full ${p.color}`}
          style={{
            width: p.size,
            height: p.size,
            left: "50%",
            top: "50%",
            marginLeft: -p.size / 2,
            marginTop: -p.size / 2,
          }}
          animate={{
            x: [
              Math.cos(0) * p.radius,
              Math.cos(Math.PI / 2) * p.radius,
              Math.cos(Math.PI) * p.radius,
              Math.cos((Math.PI * 3) / 2) * p.radius,
              Math.cos(Math.PI * 2) * p.radius,
            ],
            y: [
              Math.sin(0) * p.radius * 0.4,
              Math.sin(Math.PI / 2) * p.radius * 0.4,
              Math.sin(Math.PI) * p.radius * 0.4,
              Math.sin((Math.PI * 3) / 2) * p.radius * 0.4,
              Math.sin(Math.PI * 2) * p.radius * 0.4,
            ],
            scale: [0.8, 1.2, 0.8, 1.2, 0.8],
            opacity: [0.4, 1, 0.4, 1, 0.4],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

// ─── Animated gradient border ─────────────────────────
export function GlowCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative group ${className}`}>
      <motion.div
        className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-amber-500 via-purple-500 to-emerald-500 opacity-0 group-hover:opacity-30 blur-sm transition-opacity duration-500"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        style={{ backgroundSize: "200% 200%" }}
      />
      <div className="relative bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl">
        {children}
      </div>
    </div>
  );
}

// ─── Staggered list ───────────────────────────────────
export function StaggerChildren({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        visible: { transition: { staggerChildren: 0.1 } },
        hidden: {},
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Parallax section ─────────────────────────────────
export function ParallaxText({
  children,
  speed = 0.5,
  className = "",
}: {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    function handleScroll() {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const progress = (windowHeight - rect.top) / (windowHeight + rect.height);
      setOffset(progress * 100 * speed);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y: offset }}>{children}</motion.div>
    </div>
  );
}
