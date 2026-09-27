import { NextResponse } from "next/server";
import { executeAction } from "@/lib/crymad-crm/actions";
import { handleSignedRequest } from "@/lib/crymad-crm/inbound";

export const dynamic = "force-dynamic";

// POST /crymad-crm/v1/actions/{action}. Body {customer_external_id, reason,
// ticket_id, agent_id, approved_by?, verification_ref?, dry_run?} plus an
// Idempotency-Key header. `?dry_run=true` is accepted as well.
export async function POST(req: Request, { params }: { params: { action: string } }) {
  return handleSignedRequest(req, async (rawBody, env) => {
    const url = new URL(req.url);
    const result = await executeAction(
      env,
      params.action,
      rawBody,
      req.headers.get("idempotency-key"),
      url.searchParams.get("dry_run") === "true"
    );
    if (result.replayedBody !== undefined) {
      return new NextResponse(result.replayedBody, {
        status: result.status,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "Idempotent-Replayed": "true" },
      });
    }
    return NextResponse.json(result.body, { status: result.status, headers: { "Cache-Control": "no-store" } });
  });
}
