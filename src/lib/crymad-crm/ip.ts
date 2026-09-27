// Client IP detection and allowlist matching for inbound CRM calls.
// Railway's edge appends the real client address to X-Forwarded-For, so the
// last entry is the one we trust; earlier entries can be set by the caller.

interface ParsedIp {
  version: 4 | 6;
  value: bigint;
}

const BITS = { 4: 32, 6: 128 } as const;

function parseIpv4(ip: string): bigint | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let value = BigInt(0);
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const octet = Number(part);
    if (octet > 255) return null;
    value = value * BigInt(256) + BigInt(octet);
  }
  return value;
}

function parseIpv6(ip: string): bigint | null {
  const halves = ip.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  let groups: string[];
  if (halves.length === 2) {
    const missing = 8 - head.length - tail.length;
    if (missing < 1) return null;
    groups = [...head, ...Array(missing).fill("0"), ...tail];
  } else {
    groups = head;
  }
  if (groups.length !== 8) return null;
  let value = BigInt(0);
  for (const group of groups) {
    if (!/^[0-9a-f]{1,4}$/i.test(group)) return null;
    value = value * BigInt(65536) + BigInt(parseInt(group, 16));
  }
  return value;
}

export function parseIp(raw: string): ParsedIp | null {
  let ip = raw.trim();
  if (ip.startsWith("[") && ip.endsWith("]")) ip = ip.slice(1, -1);
  const zone = ip.indexOf("%");
  if (zone >= 0) ip = ip.slice(0, zone);
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(ip);
  if (mapped) ip = mapped[1];

  if (ip.includes(".") && !ip.includes(":")) {
    const value = parseIpv4(ip);
    return value === null ? null : { version: 4, value };
  }
  if (ip.includes(":")) {
    const value = parseIpv6(ip);
    return value === null ? null : { version: 6, value };
  }
  return null;
}

function matches(ip: ParsedIp, rule: string) {
  const [address, prefixText] = rule.split("/");
  const network = parseIp(address);
  if (!network || network.version !== ip.version) return false;
  const bits = BITS[ip.version];
  const prefix = prefixText === undefined ? bits : Number(prefixText);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > bits) return false;
  const shift = BigInt(bits - prefix);
  return ip.value >> shift === network.value >> shift;
}

export function isIpAllowed(ip: string, rules: string[]) {
  const parsed = parseIp(ip);
  if (!parsed) return false;
  return rules.some((rule) => matches(parsed, rule));
}

export function getClientIp(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded.split(",").map((hop) => hop.trim()).filter(Boolean);
    if (hops.length) return hops[hops.length - 1];
  }
  return headers.get("x-real-ip")?.trim() || null;
}
