"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  Shield,
  Award,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  Zap,
  Target,
  Wallet,
  Network,
  CheckCircle2,
  Star,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FadeIn,
  AnimatedCounter,
  TiltCard,
  FloatingOrb,
  SpinningCube,
  OrbitingParticles,
  GlowCard,
  StaggerChildren,
  StaggerItem,
} from "./animated-elements";
import { NetworkShowcase } from "./network-visualization";
import { ReferralTreeVisual } from "./referral-tree-visual";

// ─── FAQ Accordion ────────────────────────────────────
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-700/50 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-800/50 transition-colors"
      >
        <span className="text-white font-medium pr-4">{question}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-5 w-5 text-amber-400 flex-shrink-0" />
        </motion.div>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <p className="px-5 pb-5 text-slate-400 leading-relaxed">{answer}</p>
      </motion.div>
    </div>
  );
}

// ─── Main Landing Page ────────────────────────────────
export function LandingClient() {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* ═══════════════════ NAVBAR ═══════════════════ */}
      <nav className="border-b border-slate-800/50 backdrop-blur-md sticky top-0 z-50 bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="PipZen" width={40} height={40} className="rounded-xl" />
              <div>
                <span className="text-xl font-bold text-white">PipZen</span>
                <span className="text-xs text-amber-400 font-medium ml-1">Partners</span>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-slate-400 hover:text-white transition-colors">Features</a>
              <a href="#commissions" className="text-sm text-slate-400 hover:text-white transition-colors">Commissions</a>
              <a href="#how-it-works" className="text-sm text-slate-400 hover:text-white transition-colors">How It Works</a>
              <a href="#faq" className="text-sm text-slate-400 hover:text-white transition-colors">FAQ</a>
            </div>
            <Link href="/login">
              <Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-semibold">
                Partner Login
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="relative min-h-[90vh] flex items-center">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent" />
        <FloatingOrb size={400} color="amber" className="top-10 left-[10%]" delay={0} />
        <FloatingOrb size={300} color="purple" className="top-40 right-[5%]" delay={5} />
        <FloatingOrb size={250} color="emerald" className="bottom-20 left-[20%]" delay={10} />
        <FloatingOrb size={200} color="sky" className="bottom-40 right-[25%]" delay={15} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text */}
            <div>
              <FadeIn>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-8">
                  <Award className="h-4 w-4" />
                  Exclusive Partner Program
                </div>
              </FadeIn>

              <FadeIn delay={0.1}>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight">
                  Turn Your Network Into{" "}
                  <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent">
                    Passive Income
                  </span>
                </h1>
              </FadeIn>

              <FadeIn delay={0.2}>
                <p className="text-lg sm:text-xl text-slate-400 mb-8 leading-relaxed max-w-lg">
                  Join the PipZen Partner Program and earn <span className="text-amber-400 font-semibold">multi-level commissions</span> — 6% on direct referrals, 3% on Level 2, and 1% on Level 3.
                  Track earnings in real-time, monitor your referrals, and withdraw your commissions — all from one powerful dashboard.
                </p>
              </FadeIn>

              <FadeIn delay={0.3}>
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Link href="/login">
                    <Button size="lg" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-semibold text-lg px-8 h-14 w-full sm:w-auto shadow-lg shadow-amber-500/25">
                      Get Started
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <a href="#how-it-works">
                    <Button size="lg" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white text-lg px-8 h-14 w-full sm:w-auto">
                      Learn More
                      <ChevronRight className="ml-1 h-5 w-5" />
                    </Button>
                  </a>
                </div>
              </FadeIn>

              <FadeIn delay={0.4}>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Apply on PipZen.io
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    3 Commission Levels
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Instant Tracking
                  </div>
                </div>
              </FadeIn>
            </div>

            {/* Right: 3D animated visual */}
            <FadeIn delay={0.3} direction="left">
              <div className="relative hidden lg:flex items-center justify-center">
                <OrbitingParticles className="w-[400px] h-[400px]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <SpinningCube size={80} />
                </div>
                {/* Floating stat cards */}
                <motion.div
                  className="absolute top-8 -left-4 bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-xl px-4 py-3 shadow-xl"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Commission</p>
                      <p className="text-sm font-bold text-emerald-400">+$245.00</p>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  className="absolute bottom-12 -right-4 bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-xl px-4 py-3 shadow-xl"
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <Users className="h-4 w-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">New Referral</p>
                      <p className="text-sm font-bold text-white">John joined!</p>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  className="absolute top-1/2 -right-8 bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-xl px-4 py-3 shadow-xl"
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Network</p>
                      <p className="text-sm font-bold text-white">+12 this week</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ═══════════════════ TRUSTED BY / STATS ═══════════════════ */}
      <section className="py-16 border-y border-slate-800/50 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <p className="text-center text-sm text-slate-500 mb-10 uppercase tracking-widest font-medium">
              Built for serious partners
            </p>
          </FadeIn>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: 6, suffix: "%", label: "Max Commission Rate" },
              { value: 3, suffix: " Levels", label: "Commission Tiers" },
              { value: 100, suffix: "%", label: "Transparent Tracking" },
              { value: 24, suffix: "/7", label: "Dashboard Access" },
            ].map((stat, i) => (
              <FadeIn key={stat.label} delay={i * 0.1}>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-white mb-1">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ COMMISSION STRUCTURE ═══════════════════ */}
      <section id="commissions" className="py-24 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-4">
                <DollarSign className="h-3 w-3" /> Earning Structure
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Multi-Level Commission{" "}
                <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                  Structure
                </span>
              </h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                Earn commissions across three levels of your network — on direct referrals and two levels beyond.
                Every purchase through your network earns you money.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16">
            {[
              {
                pct: "6%",
                level: "Level 1",
                desc: "Your direct referrals. Every purchase they make earns you 6% commission instantly.",
                color: "amber",
                gradient: "from-amber-400 to-amber-500",
              },
              {
                pct: "3%",
                level: "Level 2",
                desc: "Purchases from the second level of your network. Earn 3% when your downline's referrals buy too.",
                color: "emerald",
                gradient: "from-emerald-400 to-emerald-500",
              },
              {
                pct: "1%",
                level: "Level 3",
                desc: "The third level of your network. When your downline's referrals also bring in buyers, you still earn.",
                color: "sky",
                gradient: "from-sky-400 to-sky-500",
              },
            ].map((tier, i) => (
              <FadeIn key={tier.level} delay={i * 0.15}>
                <TiltCard>
                  <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 text-center relative overflow-hidden h-full">
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${tier.gradient}`} />
                    <motion.div
                      className={`text-5xl font-bold text-${tier.color}-400 mb-2`}
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ type: "spring", bounce: 0.5, delay: i * 0.2 }}
                    >
                      {tier.pct}
                    </motion.div>
                    <div className="text-xl font-semibold text-white mb-3">{tier.level}</div>
                    <p className="text-slate-400 text-sm leading-relaxed">{tier.desc}</p>
                  </div>
                </TiltCard>
              </FadeIn>
            ))}
          </div>

          {/* Commission example */}
          <FadeIn>
            <GlowCard className="max-w-3xl mx-auto">
              <div className="p-8">
                <h3 className="text-lg font-semibold text-white mb-4 text-center">Example: How Your Earnings Stack Up</h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-900/50 rounded-xl p-4 text-center">
                    <p className="text-xs text-slate-500 mb-1">Buyer pays</p>
                    <p className="text-2xl font-bold text-white">$500</p>
                    <p className="text-xs text-slate-500 mt-1">for a challenge account</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-xl p-4 text-center">
                    <p className="text-xs text-slate-500 mb-1">You earn (Level 1)</p>
                    <p className="text-2xl font-bold text-emerald-400">$30</p>
                    <p className="text-xs text-slate-500 mt-1">6% commission</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-xl p-4 text-center">
                    <p className="text-xs text-slate-500 mb-1">Your upline earns (L2)</p>
                    <p className="text-2xl font-bold text-sky-400">$15</p>
                    <p className="text-xs text-slate-500 mt-1">3% commission</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-xl p-4 text-center">
                    <p className="text-xs text-slate-500 mb-1">Their upline earns (L3)</p>
                    <p className="text-2xl font-bold text-purple-400">$5</p>
                    <p className="text-xs text-slate-500 mt-1">1% commission</p>
                  </div>
                </div>
                <p className="text-center text-xs text-slate-500 mt-4">
                  Commissions cascade up the tree — everyone in the chain benefits.
                </p>
              </div>
            </GlowCard>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════ NETWORK VISUALIZATION ═══════════════════ */}
      <NetworkShowcase />

      {/* ═══════════════════ FEATURES ═══════════════════ */}
      <section id="features" className="py-24 bg-slate-900/50 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-medium mb-4">
                <Zap className="h-3 w-3" /> Platform Features
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Everything You Need to{" "}
                <span className="bg-gradient-to-r from-sky-400 to-sky-600 bg-clip-text text-transparent">Succeed</span>
              </h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                Powerful tools, real-time analytics, and a beautiful dashboard designed to help you grow your network and maximize earnings.
              </p>
            </div>
          </FadeIn>

          <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Network,
                title: "Interactive Network Tree",
                description: "Visualize your entire referral network with an expandable, color-coded tree view. See every level and track growth at a glance.",
                color: "text-amber-400",
                bg: "bg-amber-500/10",
              },
              {
                icon: DollarSign,
                title: "Real-Time Earnings",
                description: "Track commissions as they happen. See pending, approved, and paid earnings with detailed breakdowns by level and referral.",
                color: "text-emerald-400",
                bg: "bg-emerald-500/10",
              },
              {
                icon: Wallet,
                title: "Secure Withdrawals",
                description: "Request payouts via bank transfer or crypto. Track your withdrawal status and history with full transparency.",
                color: "text-sky-400",
                bg: "bg-sky-500/10",
              },
              {
                icon: BarChart3,
                title: "Performance Analytics",
                description: "Comprehensive dashboard with growth metrics, earnings trends, and network performance data — all in real time.",
                color: "text-purple-400",
                bg: "bg-purple-500/10",
              },
              {
                icon: TrendingUp,
                title: "Leaderboard & Rankings",
                description: "See where you stand against top-performing partners. Track your position and get motivated to climb the ranks.",
                color: "text-amber-400",
                bg: "bg-amber-500/10",
              },
              {
                icon: Shield,
                title: "Full Transparency",
                description: "Every commission, referral, and transaction is tracked and visible. No hidden fees, no surprises — just clear data.",
                color: "text-emerald-400",
                bg: "bg-emerald-500/10",
              },
            ].map(({ icon: Icon, title, description, color, bg }) => (
              <StaggerItem key={title}>
                <TiltCard className="h-full">
                  <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/60 transition-all duration-300 h-full">
                    <div className={`w-12 h-12 rounded-lg ${bg} flex items-center justify-center mb-4`}>
                      <Icon className={`h-6 w-6 ${color}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
                  </div>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* ═══════════════════ HOW IT WORKS ═══════════════════ */}
      <section id="how-it-works" className="py-24 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium mb-4">
                <Target className="h-3 w-3" /> Getting Started
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                How It{" "}
                <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">Works</span>
              </h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                From application to your first commission — here&apos;s your journey with PipZen Partners.
              </p>
            </div>
          </FadeIn>

          <div className="max-w-5xl mx-auto">
            {[
              {
                step: "01",
                title: "Apply on PipZen",
                description: "Sign up on pipzen.io and apply for affiliate partner status. The PipZen team reviews your application, and once approved, you'll receive an invitation email with a link to access the Partner Portal.",
                color: "amber",
              },
              {
                step: "02",
                title: "Set Up Your Account",
                description: "Follow the invite link to the PipZen Partner Portal. Complete your profile and get familiar with your dashboard. Your unique referral link on pipzen.io is set up and ready to go.",
                color: "emerald",
              },
              {
                step: "03",
                title: "Share & Earn",
                description: "Share your referral link anywhere — social media, forums, groups, direct messages. When someone purchases a prop firm account through your link on pipzen.io, you earn 6% commission. If their referrals buy too, you earn 3% on those — and 1% on the level after that.",
                color: "sky",
              },
              {
                step: "04",
                title: "Track Your Earnings",
                description: "Every commission is tracked in real-time on your dashboard. See exactly how much you've earned, which referrals are most active, and your total pending vs. paid commissions. Full transparency, always.",
                color: "purple",
              },
              {
                step: "05",
                title: "Withdraw Your Commissions",
                description: "When you're ready, request a withdrawal via bank transfer or cryptocurrency. Track the status of every withdrawal request in your dashboard. It's your money — access it on your terms.",
                color: "amber",
              },
            ].map((item, i) => (
              <FadeIn key={item.step} delay={i * 0.1}>
                <div className="flex gap-6 mb-12 last:mb-0">
                  <div className="flex flex-col items-center">
                    <motion.div
                      className={`w-14 h-14 rounded-2xl bg-${item.color}-500/20 border border-${item.color}-500/30 flex items-center justify-center flex-shrink-0`}
                      whileInView={{ scale: [0.5, 1.1, 1] }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                    >
                      <span className={`text-xl font-bold text-${item.color}-400`}>{item.step}</span>
                    </motion.div>
                    {i < 4 && <div className="w-0.5 h-full bg-slate-800 mt-2" />}
                  </div>
                  <div className="pb-8">
                    <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                    <p className="text-slate-400 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ WHY PIPZEN ═══════════════════ */}
      <section className="py-24 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <FadeIn>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium mb-4">
                  <Star className="h-3 w-3" /> Why Choose Us
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                  Why Partners Choose{" "}
                  <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">PipZen</span>
                </h2>
              </FadeIn>

              <div className="space-y-5">
                {[
                  {
                    title: "Industry-Leading Commission Rates",
                    desc: "6% on direct referrals, 3% on Level 2, and 1% on Level 3. Most programs cap at 1 level — we give you three.",
                  },
                  {
                    title: "Fully Transparent Dashboard",
                    desc: "Every commission, referral, and transaction is tracked and visible. No hidden fees, no surprises.",
                  },
                  {
                    title: "Professional Marketing Support",
                    desc: "Access banners, social assets, email templates, and training resources to help you convert.",
                  },
                  {
                    title: "Fast & Flexible Withdrawals",
                    desc: "Withdraw via bank or crypto. Track your request status in real-time from your dashboard.",
                  },
                  {
                    title: "Dedicated Admin Support",
                    desc: "Direct messaging with admin for any questions or support. You're never left without answers.",
                  },
                ].map((item, i) => (
                  <FadeIn key={item.title} delay={i * 0.1}>
                    <div className="flex gap-4">
                      <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="h-4 w-4 text-amber-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium mb-1">{item.title}</h4>
                        <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>

            {/* Right: 3D visual */}
            <FadeIn direction="left">
              <div className="relative">
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 relative overflow-hidden">
                  {/* Simulated dashboard */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-500">Total Earnings</p>
                        <p className="text-3xl font-bold text-white">$4,280.50</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-emerald-400" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Pending", value: "$340", color: "text-amber-400" },
                        { label: "Paid", value: "$3,940", color: "text-emerald-400" },
                        { label: "Referrals", value: "47", color: "text-sky-400" },
                      ].map((s) => (
                        <div key={s.label} className="bg-slate-900/50 rounded-lg p-3 text-center">
                          <p className="text-xs text-slate-500">{s.label}</p>
                          <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                        </div>
                      ))}
                    </div>
                    {/* Animated bar chart */}
                    <div className="pt-4">
                      <p className="text-xs text-slate-500 mb-3">Monthly Earnings</p>
                      <div className="flex items-end gap-2 h-24">
                        {[35, 50, 40, 65, 55, 80, 70, 90, 75, 95, 85, 100].map((h, i) => (
                          <motion.div
                            key={i}
                            className="flex-1 bg-gradient-to-t from-amber-500/60 to-amber-400/30 rounded-t"
                            initial={{ height: 0 }}
                            whileInView={{ height: `${h}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.05 }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Glow effect */}
                  <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl" />
                </div>

                {/* Floating notification */}
                <motion.div
                  className="absolute -top-4 -right-4 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 shadow-2xl"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-xs text-slate-300">New commission: <span className="text-emerald-400 font-medium">+$30.00</span></p>
                  </div>
                </motion.div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ═══════════════════ COMPARISON ═══════════════════ */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                PipZen vs. Other Programs
              </h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                See why PipZen Partners stands out from typical affiliate programs.
              </p>
            </div>
          </FadeIn>

          <FadeIn>
            <div className="max-w-3xl mx-auto">
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-3 gap-0">
                  <div className="p-4 border-b border-r border-slate-700 bg-slate-800/80">
                    <p className="text-sm font-medium text-slate-400">Feature</p>
                  </div>
                  <div className="p-4 border-b border-r border-slate-700 bg-amber-500/10">
                    <p className="text-sm font-bold text-amber-400 text-center">PipZen Partners</p>
                  </div>
                  <div className="p-4 border-b border-slate-700 bg-slate-800/80">
                    <p className="text-sm font-medium text-slate-400 text-center">Others</p>
                  </div>

                  {[
                    { feature: "Commission Rate", pipzen: "6% / 3% / 1%", others: "1-3%" },
                    { feature: "Commission Levels", pipzen: "3 Levels", others: "1-2 levels" },
                    { feature: "Real-Time Tracking", pipzen: true, others: false },
                    { feature: "Network Tree View", pipzen: true, others: false },
                    { feature: "Crypto Withdrawals", pipzen: true, others: false },
                    { feature: "Training Resources", pipzen: true, others: false },
                    { feature: "Direct Admin Chat", pipzen: true, others: false },
                    { feature: "Campaign Bonuses", pipzen: true, others: false },
                  ].map((row) => (
                    <>
                      <div key={`f-${row.feature}`} className="p-4 border-b border-r border-slate-700 flex items-center">
                        <p className="text-sm text-slate-300">{row.feature}</p>
                      </div>
                      <div key={`p-${row.feature}`} className="p-4 border-b border-r border-slate-700 flex items-center justify-center">
                        {typeof row.pipzen === "boolean" ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        ) : (
                          <p className="text-sm font-medium text-amber-400">{row.pipzen}</p>
                        )}
                      </div>
                      <div key={`o-${row.feature}`} className="p-4 border-b border-slate-700 flex items-center justify-center">
                        {typeof row.others === "boolean" ? (
                          <X className="h-5 w-5 text-slate-600" />
                        ) : (
                          <p className="text-sm text-slate-500">{row.others}</p>
                        )}
                      </div>
                    </>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════ FAQ ═══════════════════ */}
      <section id="faq" className="py-24 scroll-mt-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-slate-400 text-lg">
                Got questions? We&apos;ve got answers.
              </p>
            </div>
          </FadeIn>

          <FadeIn>
            <div className="space-y-3">
              <FAQItem
                question="How do I become a PipZen Partner?"
                answer="Sign up on pipzen.io and apply for affiliate partner status. Once the PipZen team reviews and approves your application, you'll receive an invitation email with a link to access the Partner Portal and set up your account."
              />
              <FAQItem
                question="How are commissions calculated?"
                answer="You earn 6% on Level 1 (direct referrals), 3% on Level 2 (your referrals' referrals), and 1% on Level 3. That's three levels of earning on every purchase made through your network. Commissions are calculated on the purchase amount."
              />
              <FAQItem
                question="How do I get my referral link?"
                answer="Your PipZen referral link is set up by admin when you're invited and displayed on your partner dashboard. This link points to the main PipZen website. When someone purchases through your link, it's tracked and you earn commissions."
              />
              <FAQItem
                question="How often can I withdraw?"
                answer="You can request a withdrawal at any time from your dashboard. Simply choose your preferred method (bank transfer or crypto), enter the amount, and submit. You'll be able to track the status of your request in real-time."
              />
              <FAQItem
                question="Is there a minimum withdrawal amount?"
                answer="The minimum withdrawal amount and any applicable fees are configured by admin and may vary. Check your dashboard for the current withdrawal terms."
              />
              <FAQItem
                question="Can I see who's in my network?"
                answer="Absolutely. Your partner dashboard includes an interactive network tree that shows every referral in your downline, color-coded by level. You can expand and collapse branches, see referral counts, and view earnings per node."
              />
              <FAQItem
                question="When do I earn commissions?"
                answer="Commissions are earned when someone purchases a prop firm account through your referral link on pipzen.io. Each qualifying purchase is tracked automatically and your commission is calculated in real-time."
              />
              <FAQItem
                question="How do multi-level commissions work?"
                answer="You earn 6% on purchases made by your direct referrals (Level 1). If anyone in your downline also refers buyers, you earn 3% on those purchases (Level 2), and 1% on the third level. Three tiers of commissions from a single referral network."
              />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════ REFERRAL TREE ═══════════════════ */}
      <ReferralTreeVisual />

      {/* ═══════════════════ FINAL CTA ═══════════════════ */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="relative overflow-hidden rounded-3xl">
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-slate-800 to-purple-500/20" />
              <FloatingOrb size={200} color="amber" className="top-0 right-0" delay={0} />
              <FloatingOrb size={150} color="purple" className="bottom-0 left-0" delay={5} />

              <div className="relative border border-slate-700 rounded-3xl p-12 sm:p-16 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", bounce: 0.4 }}
                  className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-8 shadow-lg shadow-amber-500/30"
                >
                  <Zap className="h-10 w-10 text-slate-900" />
                </motion.div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                  Ready to Start{" "}
                  <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">Earning</span>?
                </h2>
                <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
                  Log in to your partner dashboard to track your network, view your earnings, and manage your commissions.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/login">
                    <Button size="lg" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-semibold text-lg px-10 h-14 shadow-lg shadow-amber-500/25 w-full sm:w-auto">
                      Partner Login
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
                <p className="text-sm text-slate-500 mt-6">
                  Want to become a partner? Apply for affiliate status on pipzen.io.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="border-t border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Image src="/logo.png" alt="PipZen" width={36} height={36} className="rounded-lg" />
                <span className="text-lg font-bold text-white">PipZen Partners</span>
              </div>
              <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                The premier partner program for PipZen prop trading. Earn multi-level commissions on referral purchases
                and grow your income with the most transparent platform in the industry.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Quick Links</h4>
              <div className="space-y-2">
                <a href="#features" className="block text-sm text-slate-400 hover:text-white transition-colors">Features</a>
                <a href="#commissions" className="block text-sm text-slate-400 hover:text-white transition-colors">Commissions</a>
                <a href="#how-it-works" className="block text-sm text-slate-400 hover:text-white transition-colors">How It Works</a>
                <a href="#faq" className="block text-sm text-slate-400 hover:text-white transition-colors">FAQ</a>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Partner Access</h4>
              <div className="space-y-2">
                <Link href="/login" className="block text-sm text-slate-400 hover:text-white transition-colors">Partner Login</Link>
                <a href="https://pipzen.io" target="_blank" rel="noopener noreferrer" className="block text-sm text-slate-400 hover:text-white transition-colors">Visit PipZen.io</a>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} PipZen. All rights reserved.
            </p>
            <p className="text-xs text-slate-600">
              Partner platform powered by PipZen
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
