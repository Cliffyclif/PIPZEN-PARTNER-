import { crmError, crmJson } from "@/lib/crymad-crm/http";
import { authenticateCrmRequest, readRawBody } from "@/lib/crymad-crm/inbound";
import { processWebhookEvents, recordWebhookEvent, webhookRowId } from "@/lib/crymad-crm/webhooks";

export const dynamic = "force-dynamic";

// POST /api/crymad-crm/webhooks: CRM to Pipzen events (contract section 5).
// Verified, stored and acknowledged; the work happens after the response.
export async function POST(req: Request) {
  try {
    const rawBody = await readRawBody(req);
    const check = await authenticateCrmRequest(req, rawBody, "webhook");
    if (!check.ok) return check.response;

    const eventId = req.headers.get("x-cmx-event-id")?.trim();
    const eventType = req.headers.get("x-cmx-event-type")?.trim();
    if (!eventId || !eventType || eventId.length > 200 || eventType.length > 100) {
      return crmError(400, "validation_failed", "X-CMX-Event-Id and X-CMX-Event-Type headers are required");
    }

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody.toString("utf8"));
    } catch {
      return crmError(400, "invalid_json", "Request body is not valid JSON");
    }

    const isNew = await recordWebhookEvent(check.environment, eventId, eventType, payload);
    if (isNew) {
      processWebhookEvents([webhookRowId(check.environment, eventId)]).catch((error) =>
        console.error("[crymad-crm] Webhook processing failed; the worker will retry", error)
      );
    }
    return crmJson({ received: true, duplicate: !isNew });
  } catch (error) {
    console.error("[crymad-crm] Webhook request failed", error);
    return crmError(500, "internal_error", "Pipzen could not store the event");
  }
}
