import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCrmConfig, type CrmEnvironment } from "./config";
import {
  SIGNATURE_TOLERANCE_SECONDS,
  requestPayload,
  sha256Hex,
  verifySignature,
  webhookPayload,
  type SignatureFailure,
} from "./crypto";
import { crmError } from "./http";
import { getClientIp, isIpAllowed } from "./ip";
import { ensureCrmTables } from "./schema";

const FAILURE_MESSAGES: Record<SignatureFailure, [string, string]> = {
  missing: ["signature_missing", "X-CMX-Signature header is required"],
  malformed: ["signature_malformed", "X-CMX-Signature header could not be parsed"],
  expired: ["signature_expired", "Signature timestamp is outside the 5 minute window"],
  mismatch: ["signature_invalid", "Signature does not match"],
};

// Records a verified signature. Returns false when it was already used, so each
// signature is accepted once inside its window (contract v1.1). The key is the
// signed content per environment, so dropping one v1 value from a captured
// rotation header cannot turn a replay into a "new" request.
async function claimSignature(environment: CrmEnvironment, signedPayload: Buffer, t: number) {
  await ensureCrmTables();
  const { count } = await prisma.crmReplayGuard.createMany({
    data: [
      {
        signature: `${environment}:${sha256Hex(signedPayload)}`,
        expiresAt: new Date((t + SIGNATURE_TOLERANCE_SECONDS + 60) * 1000),
      },
    ],
    skipDuplicates: true,
  });
  return count === 1;
}

export type InboundCheck =
  | { ok: true; environment: CrmEnvironment }
  | { ok: false; response: NextResponse };

// Authenticates a call from the CRM: optional IP allowlist, HMAC signature over
// the raw body, 5 minute window, single use. The secret that matched decides
// whether the call belongs to the live or the test environment.
export async function authenticateCrmRequest(
  req: Request,
  rawBody: Buffer,
  kind: "webhook" | "request"
): Promise<InboundCheck> {
  const config = getCrmConfig();
  const environments = (["live", "test"] as const).filter((env) => config[env].webhookSecrets.length > 0);
  if (environments.length === 0) {
    return { ok: false, response: crmError(503, "not_configured", "The CryMad CRM integration is not configured") };
  }

  if (config.allowedIps.length > 0) {
    const ip = getClientIp(req.headers);
    if (!ip || !isIpAllowed(ip, config.allowedIps)) {
      return { ok: false, response: crmError(403, "ip_not_allowed", "Request did not come from a CryMad CRM address") };
    }
  }

  const url = new URL(req.url);
  const payloadFor =
    kind === "webhook" ? webhookPayload(rawBody) : requestPayload(req.method, `${url.pathname}${url.search}`, rawBody);
  const header = req.headers.get("x-cmx-signature");

  let failure: SignatureFailure = "mismatch";
  for (const environment of environments) {
    const result = verifySignature(header, payloadFor, config[environment].webhookSecrets);
    if (result.ok) {
      if (!(await claimSignature(environment, result.signedPayload, result.t))) {
        return { ok: false, response: crmError(401, "signature_replayed", "This signature has already been used") };
      }
      return { ok: true, environment };
    }
    failure = result.reason;
    if (failure !== "mismatch") break; // missing, malformed or expired: no other secret can fix it
  }

  const [code, message] = FAILURE_MESSAGES[failure];
  return { ok: false, response: crmError(401, code, message) };
}

export async function readRawBody(req: Request) {
  return Buffer.from(await req.arrayBuffer());
}

// Wraps a lookup/action route: authenticates the signed call, then runs it.
export async function handleSignedRequest(
  req: Request,
  handler: (rawBody: Buffer, environment: CrmEnvironment) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const rawBody = await readRawBody(req);
    const check = await authenticateCrmRequest(req, rawBody, "request");
    if (!check.ok) return check.response;
    return await handler(rawBody, check.environment);
  } catch (error) {
    console.error("[crymad-crm] Request failed", error);
    return crmError(500, "internal_error", "Pipzen could not complete the request");
  }
}
