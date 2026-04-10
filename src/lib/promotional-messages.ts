export interface PromotionalMessage {
  id: string;
  text: string;
  platforms: string[];
}

export const PROMOTIONAL_MESSAGES: PromotionalMessage[] = [
  {
    id: "msg-1",
    text: "Ready to trade with funded capital? PipZen gives you up to $200K — no risk to your own money. Start your journey today!",
    platforms: ["twitter", "facebook", "linkedin", "whatsapp", "telegram"],
  },
  {
    id: "msg-2",
    text: "I just discovered PipZen — the prop firm that actually wants you to succeed. Get funded up to $200K and keep up to 90% of your profits!",
    platforms: ["twitter", "facebook", "whatsapp"],
  },
  {
    id: "msg-3",
    text: "Stop risking your own money! PipZen gives you the capital to trade — you keep the profits. Check it out:",
    platforms: ["twitter", "whatsapp", "telegram"],
  },
  {
    id: "msg-4",
    text: "One-step evaluation. No time limits. Up to 90% profit split. PipZen is changing the prop trading game. See for yourself:",
    platforms: ["twitter", "facebook", "linkedin"],
  },
  {
    id: "msg-5",
    text: "Looking for a prop firm that actually pays? PipZen offers instant payouts, static drawdown, and up to $200K in funding. Join the movement:",
    platforms: ["twitter", "facebook", "whatsapp", "telegram"],
  },
  {
    id: "msg-6",
    text: "Why risk your own capital when you can trade with PipZen's? One simple evaluation, infinite time to pass, and up to 90% profit split.",
    platforms: ["linkedin", "facebook"],
  },
  {
    id: "msg-7",
    text: "Funded trading made simple. PipZen: 1-step eval, no time limits, instant payouts. Your trading skills deserve real capital behind them.",
    platforms: ["linkedin", "twitter"],
  },
  {
    id: "msg-8",
    text: "Just found the easiest path to funded trading — PipZen has a one-step evaluation with NO time limit. Plus they pay out up to 90% of profits!",
    platforms: ["whatsapp", "telegram", "twitter"],
  },
  {
    id: "msg-9",
    text: "Attention traders! PipZen is offering funded accounts up to $200K with one of the simplest evaluations in the industry. Don't miss out:",
    platforms: ["facebook", "twitter", "telegram"],
  },
  {
    id: "msg-10",
    text: "Trade smarter, not harder. Get funded by PipZen — up to $200K, 90% profit split, static drawdown. The future of prop trading is here:",
    platforms: ["twitter", "facebook", "linkedin", "whatsapp", "telegram"],
  },
  {
    id: "msg-11",
    text: "No more blowing your own account. PipZen funds you up to $200K with fair rules and instant payouts. Check them out:",
    platforms: ["whatsapp", "telegram"],
  },
  {
    id: "msg-12",
    text: "Prop trading done right. PipZen offers one-step evaluations, static drawdown from starting balance, and up to 90% profit splits. Level up your trading:",
    platforms: ["linkedin", "facebook", "twitter"],
  },
];

export function getRandomMessage(platform?: string): PromotionalMessage {
  const pool = platform
    ? PROMOTIONAL_MESSAGES.filter((m) => m.platforms.includes(platform))
    : PROMOTIONAL_MESSAGES;
  const candidates = pool.length > 0 ? pool : PROMOTIONAL_MESSAGES;
  return candidates[Math.floor(Math.random() * candidates.length)];
}
