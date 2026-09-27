// Minimal stand-in for CryMad CRM's REST API (contract 1.1 section 4), for tests.
import http from "node:http";
import { createHash } from "node:crypto";

const PORT = Number(process.env.MOCK_CRM_PORT || 4555);
const KEYS = { sk_live_mockkey: "live", sk_test_mockkey: "test" };

const state = {
  requests: [],
  tickets: new Map(),
  idempotency: new Map(),
  events: [],
  failEvents: 0,
  seq: 1000,
};

const send = (res, status, body, headers = {}) => {
  res.writeHead(status, { "Content-Type": "application/json", ...headers });
  res.end(body === undefined ? "" : JSON.stringify(body));
};

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

function idempotent(env, req, raw, create) {
  const key = req.headers["idempotency-key"];
  if (!key) return { status: 400, body: { error: { code: "idempotency_key_required", message: "missing" } } };
  const hash = createHash("sha256").update(raw).digest("hex");
  const scoped = `${env}:${key}`;
  const prior = state.idempotency.get(scoped);
  if (prior) {
    if (prior.hash !== hash) return { status: 409, body: { error: { code: "idempotency_conflict", message: "different data" } } };
    return { ...prior.result, replay: true };
  }
  const result = create();
  state.idempotency.set(scoped, { hash, result });
  return result;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const raw = await readBody(req);
  const entry = { method: req.method, path: url.pathname + url.search, headers: req.headers, body: raw, at: new Date().toISOString() };

  if (url.pathname === "/widget/v1.js") {
    res.writeHead(200, { "Content-Type": "application/javascript" });
    res.end("window.CryMadCRM={calls:[],identify(o){this.calls.push(['identify']);this._get=o.getToken;},logout(){this.calls.push(['logout'])},open(){this.calls.push(['open'])},close(){},setContext(c){this.calls.push(['setContext',c])},on(){}};");
    return;
  }
  if (url.pathname === "/__log") return send(res, 200, { requests: state.requests, events: state.events });
  if (url.pathname === "/__control" && req.method === "POST") {
    Object.assign(state, JSON.parse(raw || "{}"));
    return send(res, 200, { ok: true });
  }
  if (url.pathname === "/__reset" && req.method === "POST") {
    state.requests = []; state.events = []; state.failEvents = 0;
    return send(res, 200, { ok: true });
  }

  state.requests.push(entry);
  const auth = (req.headers.authorization || "").replace(/^Bearer /, "");
  const env = KEYS[auth];
  if (!env) return send(res, 401, { error: { code: "unauthorized", message: "bad key" } });

  let m;
  if (req.method === "POST" && url.pathname === "/v1/tickets") {
    const body = JSON.parse(raw);
    const r = idempotent(env, req, raw, () => {
      const id = `tkt_${++state.seq}`;
      const now = new Date().toISOString();
      state.tickets.set(id, {
        id, env, number: state.seq, subject: body.subject, status: "open", created_at: now, updated_at: now,
        customer: body.customer, category: body.category,
        messages: [{ id: `msg_${state.seq}_1`, body: body.body, author_type: "customer", created_at: now }],
      });
      return { status: 201, body: { id, number: state.seq, status: "open" } };
    });
    return send(res, r.status, r.body);
  }
  if (req.method === "GET" && (m = url.pathname.match(/^\/v1\/tickets\/([^/]+)$/))) {
    const t = state.tickets.get(decodeURIComponent(m[1]));
    if (!t || t.env !== env) return send(res, 404, { error: { code: "not_found", message: "no ticket" } });
    const { env: _e, ...ticket } = t;
    return send(res, 200, ticket);
  }
  if (req.method === "POST" && (m = url.pathname.match(/^\/v1\/tickets\/([^/]+)\/messages$/))) {
    const t = state.tickets.get(decodeURIComponent(m[1]));
    if (!t || t.env !== env) return send(res, 404, { error: { code: "not_found", message: "no ticket" } });
    if (t.status === "closed") return send(res, 409, { error: { code: "ticket_closed", message: "closed" } });
    const body = JSON.parse(raw);
    const r = idempotent(env, req, raw, () => {
      const now = new Date().toISOString();
      const msg = { id: `msg_${t.number}_${t.messages.length + 1}`, body: body.body, author_type: "customer", created_at: now };
      t.messages.push(msg);
      t.updated_at = now;
      return { status: 201, body: msg };
    });
    return send(res, r.status, r.body);
  }
  if (req.method === "GET" && (m = url.pathname.match(/^\/v1\/customers\/([^/]+)\/tickets$/))) {
    const ext = decodeURIComponent(m[1]);
    const limit = Number(url.searchParams.get("limit") || 20);
    const all = [...state.tickets.values()].filter((t) => t.env === env && t.customer?.external_id === ext).reverse();
    const start = Number(url.searchParams.get("cursor") || 0);
    const page = all.slice(start, start + limit).map(({ env: _e, messages: _m, ...t }) => t);
    return send(res, 200, { data: page, next_cursor: start + limit < all.length ? String(start + limit) : null });
  }
  if (req.method === "POST" && url.pathname === "/v1/platform-events") {
    if (state.failEvents > 0) {
      state.failEvents--;
      return send(res, 503, { error: { code: "unavailable", message: "try later" } }, { "Retry-After": "0" });
    }
    const body = JSON.parse(raw);
    const r = idempotent(env, req, raw, () => {
      state.events.push({ env, key: req.headers["idempotency-key"], ...body });
      return { status: 202, body: { accepted: true } };
    });
    return send(res, r.status, r.body);
  }
  send(res, 404, { error: { code: "not_found", message: `${req.method} ${url.pathname}` } });
});

server.listen(PORT, () => console.log(`MOCK CRM READY on ${PORT}`));
