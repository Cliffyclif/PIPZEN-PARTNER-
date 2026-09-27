import { randomUUID } from "crypto";
import { crmEnvironment, type CrmEnvironment } from "./config";

// Backend to CRM REST client (contract section 4). Retries 429, 5xx and network
// failures only when the call is safe to repeat (GET, or a create with an
// Idempotency-Key). Every call names the environment whose key it uses.

export class CrmNotConfiguredError extends Error {
  constructor() {
    super("CryMad CRM API key is not configured");
    this.name = "CrmNotConfiguredError";
  }
}

export class CrmApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "CrmApiError";
  }

  get retryable() {
    return this.status === 0 || this.status === 408 || this.status === 429 || this.status >= 500;
  }
}

interface RequestOptions {
  method?: "GET" | "POST";
  body?: unknown;
  query?: Record<string, string | number | undefined | null>;
  idempotencyKey?: string;
  timeoutMs?: number;
  maxAttempts?: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function retryDelayMs(response: Response | null, attempt: number) {
  const header = response?.headers.get("retry-after");
  if (header) {
    const seconds = Number(header);
    if (Number.isFinite(seconds)) return Math.min(seconds * 1000, 5000);
    const date = Date.parse(header);
    if (!Number.isNaN(date)) return Math.min(Math.max(date - Date.now(), 0), 5000);
  }
  return Math.min(250 * 2 ** attempt, 2000);
}

async function crmRequest<T>(env: CrmEnvironment, path: string, options: RequestOptions = {}): Promise<T> {
  const config = crmEnvironment(env);
  if (!config.secretApiKey) throw new CrmNotConfiguredError();

  const method = options.method ?? "GET";
  const url = new URL(`${config.baseUrl}${path}`);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.secretApiKey}`,
    Accept: "application/json",
  };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.idempotencyKey) headers["Idempotency-Key"] = options.idempotencyKey;

  const repeatable = method === "GET" || Boolean(options.idempotencyKey);
  const maxAttempts = repeatable ? options.maxAttempts ?? 3 : 1;

  for (let attempt = 0; ; attempt++) {
    let response: Response | null = null;
    let error: CrmApiError;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        cache: "no-store",
        signal: AbortSignal.timeout(options.timeoutMs ?? 10_000),
      });
      const text = await response.text();
      let json: unknown = null;
      if (text) {
        try {
          json = JSON.parse(text);
        } catch {
          json = null;
        }
      }
      if (response.ok) return json as T;
      const err = (json as { error?: { code?: string; message?: string; details?: unknown } } | null)?.error;
      error = new CrmApiError(
        response.status,
        err?.code ?? `http_${response.status}`,
        err?.message ?? `CryMad CRM responded with HTTP ${response.status}`,
        err?.details
      );
    } catch (cause) {
      if (cause instanceof CrmApiError) throw cause;
      error = new CrmApiError(0, "network_error", cause instanceof Error ? cause.message : "Network error");
    }

    if (!error.retryable || attempt + 1 >= maxAttempts) throw error;
    await sleep(retryDelayMs(response, attempt));
  }
}

// Types. The contract fixes the create response ({id, number, status}); the
// rest of the ticket shape is read defensively and normalised below.

export interface CrmCustomerRef {
  external_id?: string;
  email: string;
  name?: string;
}

export interface CreateTicketInput {
  customer: CrmCustomerRef;
  subject: string;
  body: string;
  category?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  external_ref?: string;
  fields?: Record<string, unknown>;
  attachment_ids?: string[];
}

export interface CreatedTicket {
  id: string;
  number: string | number;
  status: string;
}

export interface TicketSummary {
  id: string;
  number: string | null;
  subject: string;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface TicketMessage {
  id: string;
  body: string;
  fromCustomer: boolean;
  authorName: string | null;
  createdAt: string | null;
}

export interface TicketDetail extends TicketSummary {
  customerExternalId: string | null;
  messages: TicketMessage[];
}

export interface TicketPage {
  tickets: TicketSummary[];
  nextCursor: string | null;
}

type Json = Record<string, unknown>;

const str = (value: unknown) => (typeof value === "string" && value.length > 0 ? value : null);

function normaliseSummary(raw: Json): TicketSummary {
  return {
    id: String(raw.id ?? ""),
    number: raw.number === undefined || raw.number === null ? null : String(raw.number),
    subject: str(raw.subject) ?? "(no subject)",
    status: str(raw.status) ?? "open",
    createdAt: str(raw.created_at),
    updatedAt: str(raw.updated_at) ?? str(raw.last_message_at) ?? str(raw.created_at),
  };
}

function normaliseMessage(raw: Json): TicketMessage {
  const author = (raw.author ?? {}) as Json;
  const authorType = str(raw.author_type) ?? str(author.type) ?? str(raw.sender_type) ?? "";
  return {
    id: String(raw.id ?? randomUUID()),
    body: str(raw.body) ?? str(raw.text) ?? "",
    fromCustomer: authorType === "customer" || authorType === "contact",
    authorName: str(raw.author_name) ?? str(author.name),
    createdAt: str(raw.created_at),
  };
}

function normaliseDetail(raw: Json): TicketDetail {
  const customer = (raw.customer ?? {}) as Json;
  const messages = Array.isArray(raw.messages) ? (raw.messages as Json[]) : [];
  return {
    ...normaliseSummary(raw),
    customerExternalId: str(customer.external_id) ?? str(raw.customer_external_id),
    messages: messages.map(normaliseMessage),
  };
}

function normalisePage(raw: unknown): TicketPage {
  if (Array.isArray(raw)) return { tickets: (raw as Json[]).map(normaliseSummary), nextCursor: null };
  const body = (raw ?? {}) as Json;
  const list = (body.data ?? body.tickets ?? body.items ?? []) as Json[];
  const cursor = body.next_cursor ?? body.nextCursor ?? (body.cursor as Json | undefined)?.next ?? null;
  return {
    tickets: Array.isArray(list) ? list.map(normaliseSummary) : [],
    nextCursor: typeof cursor === "string" && cursor ? cursor : null,
  };
}

// Endpoints.

export function createTicket(env: CrmEnvironment, input: CreateTicketInput, idempotencyKey: string) {
  return crmRequest<CreatedTicket>(env, "/v1/tickets", { method: "POST", body: input, idempotencyKey });
}

export function addTicketMessage(
  env: CrmEnvironment,
  ticketId: string,
  input: { customer: CrmCustomerRef; body: string; attachment_ids?: string[] },
  idempotencyKey: string
) {
  return crmRequest<Json>(env, `/v1/tickets/${encodeURIComponent(ticketId)}/messages`, {
    method: "POST",
    body: input,
    idempotencyKey,
  });
}

export async function getTicket(env: CrmEnvironment, ticketId: string) {
  return normaliseDetail(await crmRequest<Json>(env, `/v1/tickets/${encodeURIComponent(ticketId)}`));
}

export async function listCustomerTickets(
  env: CrmEnvironment,
  externalId: string,
  options: { cursor?: string | null; limit?: number } = {}
) {
  const raw = await crmRequest<unknown>(env, `/v1/customers/${encodeURIComponent(externalId)}/tickets`, {
    query: { cursor: options.cursor, limit: options.limit ?? 20 },
  });
  return normalisePage(raw);
}

export interface PlatformEventBody {
  id: string;
  type: string;
  occurred_at: string;
  customer_external_id: string;
  data: Record<string, unknown>;
}

export function sendPlatformEvent(env: CrmEnvironment, event: PlatformEventBody) {
  return crmRequest<Json>(env, "/v1/platform-events", {
    method: "POST",
    body: event,
    idempotencyKey: event.id,
    maxAttempts: 1,
  });
}
