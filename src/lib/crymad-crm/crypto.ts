import { createHash, createHmac, timingSafeEqual } from "crypto";

// Signed CRM requests must be within 5 minutes of our clock (contract §5, §7).
export const SIGNATURE_TOLERANCE_SECONDS = 300;

export function sha256Hex(data: string | Buffer) {
  return createHash("sha256").update(data).digest("hex");
}

export function hmacSha256Hex(secret: string, payload: string | Buffer) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export interface ParsedSignature {
  t: number;
  v1: string[];
}

// Parses `X-CMX-Signature: t=<unix seconds>,v1=<hex>[,v1=<hex>...]`.
// During a secret rotation the header carries one v1 per active secret.
export function parseSignatureHeader(header: string | null): ParsedSignature | null {
  if (!header) return null;
  let t: number | null = null;
  const v1: string[] = [];
  for (const part of header.split(",")) {
    const eq = part.indexOf("=");
    if (eq <= 0) continue;
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (key === "t" && /^\d{1,12}$/.test(value)) t = Number(value);
    else if (key === "v1" && /^[0-9a-f]{64}$/i.test(value)) v1.push(value.toLowerCase());
  }
  if (t === null || v1.length === 0) return null;
  return { t, v1 };
}

function hexEquals(a: string, b: string) {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

export type SignatureFailure = "missing" | "malformed" | "expired" | "mismatch";

export type SignatureResult =
  | { ok: true; t: number; signedPayload: Buffer }
  | { ok: false; reason: SignatureFailure };

// Checks the header against every configured secret. `payloadFor` builds the
// exact bytes the CRM signed for a given timestamp.
export function verifySignature(
  header: string | null,
  payloadFor: (t: number) => Buffer,
  secrets: string[],
  nowSeconds = Math.floor(Date.now() / 1000)
): SignatureResult {
  if (!header) return { ok: false, reason: "missing" };
  const parsed = parseSignatureHeader(header);
  if (!parsed) return { ok: false, reason: "malformed" };
  if (Math.abs(nowSeconds - parsed.t) > SIGNATURE_TOLERANCE_SECONDS) {
    return { ok: false, reason: "expired" };
  }
  const signedPayload = payloadFor(parsed.t);
  for (const secret of secrets) {
    const expected = hmacSha256Hex(secret, signedPayload);
    if (parsed.v1.some((candidate) => hexEquals(candidate, expected))) {
      return { ok: true, t: parsed.t, signedPayload };
    }
  }
  return { ok: false, reason: "mismatch" };
}

// Webhooks: v1 = HMAC_SHA256(whsec, t + "." + rawBody)
export function webhookPayload(rawBody: Buffer) {
  return (t: number) => Buffer.concat([Buffer.from(`${t}.`, "utf8"), rawBody]);
}

// Lookups and actions: t + "." + method + " " + pathWithQuery + "." + sha256Hex(body)
export function requestPayload(method: string, pathWithQuery: string, rawBody: Buffer) {
  const bodyHash = sha256Hex(rawBody);
  return (t: number) => Buffer.from(`${t}.${method.toUpperCase()} ${pathWithQuery}.${bodyHash}`, "utf8");
}

// Header for signing requests the same way the CRM does (used by tests and
// by anyone debugging the endpoints by hand).
export function buildSignatureHeader(secrets: string[], payload: Buffer, t: number) {
  return [`t=${t}`, ...secrets.map((secret) => `v1=${hmacSha256Hex(secret, payload)}`)].join(",");
}

function base64UrlJson(value: unknown) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

export function signJwtHs256(header: Record<string, unknown>, claims: Record<string, unknown>, secret: string) {
  const signingInput = `${base64UrlJson(header)}.${base64UrlJson(claims)}`;
  const signature = createHmac("sha256", secret).update(signingInput).digest("base64url");
  return `${signingInput}.${signature}`;
}
