import { NextResponse } from "next/server";

// Error body used by every endpoint the CRM calls (contract §4):
// {"error":{"code":"validation_failed","message":"...","details":[...]}}
export function crmError(status: number, code: string, message: string, details?: unknown[]) {
  return NextResponse.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

export function crmJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export function clampLimit(value: string | null, fallback = 20, max = 50) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

export interface Cursor {
  at: string;
  id: string;
}

export function encodeCursor(cursor: Cursor) {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function decodeCursor(value: string | null): Cursor | null | "invalid" {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (typeof parsed?.at === "string" && typeof parsed?.id === "string" && !Number.isNaN(Date.parse(parsed.at))) {
      return { at: parsed.at, id: parsed.id };
    }
  } catch {
    // fall through
  }
  return "invalid";
}
