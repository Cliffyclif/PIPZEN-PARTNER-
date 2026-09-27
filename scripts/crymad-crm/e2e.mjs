// End-to-end tests for the Pipzen partner portal CryMad CRM integration.
// Runs against `next start` on :3100, the mock CRM on :4555 and the local Postgres.
import http from "node:http";
import { createHash, createHmac, randomUUID } from "node:crypto";
import pg from "pg";

const APP = { host: "127.0.0.1", port: Number(process.env.APP_PORT || 3100) };
const MOCK = process.env.MOCK_CRM_URL || "http://127.0.0.1:4555";
const LIVE = ["whsec_live_new", "whsec_live_old"];
const TEST = ["whsec_test_1"];
const IDS = {
  admin: "cltestadmin00000000000001",
  alice: "cltestalice00000000000001",
  bob: "cltestbob0000000000000001",
  carol: "cltestcarol00000000000001",
  tester: "cltesttester0000000000001",
  wAlicePending: "cltestwalice0000000000002",
  wBobPending: "cltestwbob000000000000001",
  wTester: "cltestwtester000000000001",
};
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });

let passed = 0;
let failed = 0;
function check(name, condition, detail) {
  if (condition) {
    passed++;
    console.log(`  PASS ${name}`);
  } else {
    failed++;
    console.log(`  FAIL ${name}${detail !== undefined ? `\n       ${typeof detail === "string" ? detail : JSON.stringify(detail).slice(0, 600)}` : ""}`);
  }
}
const section = (title) => console.log(`\n${title}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function request({ method = "GET", path, host = "partner.pipzen.io", headers = {}, body, cookie }) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? undefined : Buffer.isBuffer(body) ? body : Buffer.from(typeof body === "string" ? body : JSON.stringify(body));
    const req = http.request(
      {
        ...APP,
        method,
        path,
        headers: {
          Host: host,
          ...(payload && !headers["Content-Type"] ? { "Content-Type": "application/json" } : {}),
          ...(payload ? { "Content-Length": payload.length } : {}),
          ...(cookie ? { Cookie: cookie } : {}),
          ...headers,
        },
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          let json = null;
          try { json = JSON.parse(text); } catch {}
          resolve({ status: res.statusCode, headers: res.headers, text, json });
        });
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

const sha256 = (b) => createHash("sha256").update(b).digest("hex");
const hmac = (secret, data) => createHmac("sha256", secret).update(data).digest("hex");
const now = () => Math.floor(Date.now() / 1000);
// Each signed test request gets its own timestamp (inside the 5 minute window),
// because identical requests signed in the same second are, by contract, replays.
let offset = -250;
const nextT = () => now() + (offset = offset >= 250 ? -250 : offset + 1);

function signedHeader(secrets, payloadFor, t = nextT()) {
  return [`t=${t}`, ...secrets.map((s) => `v1=${hmac(s, payloadFor(t))}`)].join(",");
}

function crm(secrets, method, path, body, extraHeaders = {}, t) {
  const raw = body === undefined ? Buffer.alloc(0) : Buffer.from(JSON.stringify(body));
  const header = signedHeader(secrets, (ts) => `${ts}.${method} ${path}.${sha256(raw)}`, t);
  return {
    header,
    send: (h = header) =>
      request({ method, path, body: body === undefined ? undefined : raw, headers: { "X-CMX-Signature": h, ...extraHeaders } }),
  };
}

function webhook(secrets, eventId, type, payload, t) {
  const raw = Buffer.from(JSON.stringify(payload));
  const header = signedHeader(secrets, (ts) => Buffer.concat([Buffer.from(`${ts}.`), raw]), t);
  return {
    header,
    send: (h = header, id = eventId) =>
      request({
        method: "POST",
        path: "/api/crymad-crm/webhooks",
        body: raw,
        headers: { "X-CMX-Signature": h, "X-CMX-Event-Id": id, "X-CMX-Event-Type": type },
      }),
  };
}

function parseCookies(setCookie = []) {
  return setCookie.map((c) => c.split(";")[0]).join("; ");
}

async function login(email, password, host = "partner.pipzen.io") {
  const csrf = await request({ path: "/api/auth/csrf", host });
  const cookie = parseCookies(csrf.headers["set-cookie"]);
  const form = new URLSearchParams({ csrfToken: csrf.json.csrfToken, email, password, json: "true", callbackUrl: "/" });
  const res = await request({
    method: "POST",
    path: "/api/auth/callback/credentials",
    host,
    cookie,
    body: form.toString(),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  const session = (res.headers["set-cookie"] || []).find((c) => c.startsWith("next-auth.session-token="));
  return session ? `${cookie}; ${session.split(";")[0]}` : null;
}

const mockLog = async () => (await fetch(`${MOCK}/__log`)).json();
const mockControl = (body) => fetch(`${MOCK}/__control`, { method: "POST", body: JSON.stringify(body) });

function decodeJwt(token) {
  const [h, p, s] = token.split(".");
  return {
    header: JSON.parse(Buffer.from(h, "base64url").toString()),
    claims: JSON.parse(Buffer.from(p, "base64url").toString()),
    valid: (secret) => createHmac("sha256", secret).update(`${h}.${p}`).digest("base64url") === s,
  };
}

async function waitFor(fn, timeoutMs = 10_000, stepMs = 250) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    const value = await fn();
    if (value) return value;
    await sleep(stepMs);
  }
  return null;
}

async function main() {
  await db.connect();
  await fetch(`${MOCK}/__reset`, { method: "POST" });

  // Wait for the app.
  const up = await waitFor(async () => (await request({ path: "/login" }).catch(() => null))?.status === 200, 60_000, 1000);
  if (!up) throw new Error("App did not start");

  section("Tables before first CRM call");
  const before = await db.query(`SELECT count(*)::int n FROM information_schema.tables WHERE table_name LIKE 'crm_%'`);
  console.log(`  crm_* tables present: ${before.rows[0].n} (0 expected unless the worker ran)`);

  section("Signatures and middleware");
  let r = await request({ path: "/crymad-crm/v1/manifest" });
  check("unsigned call gets 401 JSON, not a login redirect", r.status === 401 && r.json?.error?.code === "signature_missing", r);
  r = await request({ path: "/crymad-crm/v1/manifest", headers: { "X-CMX-Signature": "garbage" } });
  check("malformed signature is refused", r.status === 401 && r.json?.error?.code === "signature_malformed", r.json);
  r = await crm(["whsec_wrong"], "GET", "/crymad-crm/v1/manifest").send();
  check("wrong secret is refused", r.status === 401 && r.json?.error?.code === "signature_invalid", r.json);
  r = await crm(LIVE, "GET", "/crymad-crm/v1/manifest", undefined, {}, now() - 400).send();
  check("timestamp older than 5 minutes is refused", r.status === 401 && r.json?.error?.code === "signature_expired", r.json);
  r = await crm(LIVE, "GET", "/crymad-crm/v1/manifest", undefined, {}, now() + 400).send();
  check("timestamp more than 5 minutes ahead is refused", r.status === 401 && r.json?.error?.code === "signature_expired", r.json);
  const manifest = crm(LIVE, "GET", "/crymad-crm/v1/manifest");
  r = await manifest.send();
  check("valid live signature is accepted", r.status === 200 && r.json?.contract_version === "1.1", r.json);
  check("manifest lists lock_partner_account as medium with dry run", r.json?.actions?.[0]?.name === "lock_partner_account" && r.json.actions[0].risk === "medium" && r.json.actions[0].supports_dry_run === true, r.json?.actions);
  r = await manifest.send();
  check("the same signature is refused the second time", r.status === 401 && r.json?.error?.code === "signature_replayed", r.json);
  {
    const t = now();
    const header = `t=${t},v1=${hmac("whsec_other_unknown", `${t}.GET /crymad-crm/v1/manifest.${sha256("")}`)},v1=${hmac("whsec_live_old", `${t}.GET /crymad-crm/v1/manifest.${sha256("")}`)}`;
    r = await request({ path: "/crymad-crm/v1/manifest", headers: { "X-CMX-Signature": header } });
    check("rotation: any matching v1 is accepted (old secret)", r.status === 200, r.json);
  }
  const tables = await db.query(`SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'crm_%' ORDER BY 1`);
  check("crm_* tables were created on first use", tables.rows.length === 5, tables.rows.map((x) => x.table_name));

  section("Customer lookup (live)");
  let t0 = Date.now();
  r = await crm(LIVE, "GET", `/crymad-crm/v1/customers/pz_partner:${IDS.alice}`).send();
  const ms = Date.now() - t0;
  const alice = r.json;
  check("lookup by external id returns 200", r.status === 200, r.json);
  check(`lookup answered in ${ms} ms (< 800)`, ms < 800);
  check("profile.id is the namespaced external id", alice?.profile?.id === `pz_partner:${IDS.alice}`);
  check("profile fields", alice?.profile?.email === "alice@example.com" && alice.profile.status === "active" && alice.profile.language === "en" && alice.profile.username === "ALICE001", alice?.profile);
  check("admin_url deep-links to the admin panel", alice?.profile?.admin_url === `https://admin.pipzen.io/admin/partners?partner=${IDS.alice}`, alice?.profile?.admin_url);
  check("verification block", alice?.verification?.email_verified === true && alice.verification.kyc_status === "not_required" && alice.verification.twofa_enabled === false, alice?.verification);
  check("no restrictions for an active partner", Array.isArray(alice?.risk?.restrictions) && alice.risk.restrictions.length === 0);
  check("balance: available 45.10, locked 40.00 (strings)", alice?.balances?.[0]?.available === "45.10" && alice.balances[0].locked === "40.00" && alice.balances[0].asset === "USD", alice?.balances);
  check("recent_activity amounts are 2-decimal strings", alice?.recent_activity?.every((a) => /^\d+\.\d{2}$/.test(a.amount)), alice?.recent_activity);
  check("recent_activity has no explorer_url (not on-chain)", alice?.recent_activity?.every((a) => !("explorer_url" in a)));
  check("open_items: the pending crypto withdrawal, wallet masked 6+4", alice?.open_items?.length === 1 && alice.open_items[0].label === "USD 40.00 to USDT (TRC20) TQ1abc…9XYZ", alice?.open_items);
  const w = alice?.extras?.partner?.withdrawals?.find((x) => x.method === "bank");
  check("bank account masked to last 4", w?.destination === "GTBank ••••6789", w);
  check("no password hash or full numbers anywhere", !r.text.includes("$2a$") && !r.text.includes("$2b$") && !r.text.includes("0123456789") && !r.text.includes("TQ1abcdefghijklmnopqrstuvwxyz9XYZ"));
  check("extras: customer_type and visibility", alice?.extras?.customer_type === "partner" && alice.extras.visibility === "full");
  check("extras: network counts", alice?.extras?.partner?.network?.direct_referrals === 3 && alice.extras.partner.network.total_network === 4, alice?.extras?.partner?.network);
  check("extras: earnings", alice?.extras?.partner?.earnings?.total_earned === "135.10" && alice.extras.partner.earnings.pending_commissions === "24.00", alice?.extras?.partner?.earnings);
  check("extras: badges", alice?.extras?.partner?.badges?.[0]?.name === "Bronze Network");
  r = await crm(LIVE, "GET", `/crymad-crm/v1/customers?email=${encodeURIComponent("ALICE@example.com")}`).send();
  check("lookup by ?email= (case-insensitive)", r.status === 200 && r.json?.profile?.id === `pz_partner:${IDS.alice}`, r.json);
  r = await crm(LIVE, "GET", `/crymad-crm/v1/customers/pz_partner%3A${IDS.alice}`).send();
  check("percent-encoded external id works", r.status === 200, r.json);
  r = await crm(LIVE, "GET", `/crymad-crm/v1/customers/pz_partner:${IDS.tester}`).send();
  check("test partner is invisible to live keys", r.status === 404 && r.json?.error?.code === "customer_not_found", r.json);
  r = await crm(LIVE, "GET", `/crymad-crm/v1/customers/pz_trader:12345`).send();
  check("trader ids return 404", r.status === 404);
  r = await crm(LIVE, "GET", `/crymad-crm/v1/customers/pz_partner:${IDS.admin}`).send();
  check("admin accounts are not customers", r.status === 404);
  r = await crm(LIVE, "GET", `/crymad-crm/v1/customers`).send();
  check("?email is required on the collection route", r.status === 400);

  section("Detail endpoints");
  const seen = [];
  let cursor = null;
  let pages = 0;
  do {
    const path = `/crymad-crm/v1/customers/pz_partner:${IDS.alice}/transactions?limit=2${cursor ? `&cursor=${cursor}` : ""}`;
    r = await crm(LIVE, "GET", path).send();
    if (r.status !== 200) break;
    seen.push(...r.json.data);
    cursor = r.json.next_cursor;
    pages++;
  } while (cursor && pages < 10);
  check("transactions: 5 records over 3 pages of 2", seen.length === 5 && pages === 3, { pages, n: seen.length, status: r.status, body: r.json });
  check("transactions: no duplicates", new Set(seen.map((x) => x.id)).size === seen.length);
  check("transactions: newest first", seen.every((x, i) => i === 0 || seen[i - 1].created_at >= x.created_at));
  check("transactions: commission details", seen.some((x) => x.type === "commission" && x.details?.level === 2 && x.details.rate_percent === "3.00"));
  r = await crm(LIVE, "GET", `/crymad-crm/v1/customers/pz_partner:${IDS.alice}/transactions?cursor=bad`).send();
  check("bad cursor is a 400", r.status === 400, r.json);
  r = await crm(LIVE, "GET", `/crymad-crm/v1/customers/pz_partner:${IDS.alice}/orders`).send();
  check("orders: the partner's own purchase", r.status === 200 && r.json.data.length === 1 && r.json.data[0].details.package === "$10K Instant Funded X" && r.json.next_cursor === null, r.json);
  r = await crm(LIVE, "GET", `/crymad-crm/v1/lookup?ref=${IDS.wAlicePending}`).send();
  check("lookup?ref= finds a withdrawal and its owner", r.status === 200 && r.json.type === "withdrawal" && r.json.customer_external_id === `pz_partner:${IDS.alice}` && r.json.status === "pending", r.json);
  r = await crm(LIVE, "GET", `/crymad-crm/v1/lookup?ref=ALICE001`).send();
  check("lookup?ref= finds a partner by referral code", r.status === 200 && r.json.type === "partner", r.json);
  r = await crm(LIVE, "GET", `/crymad-crm/v1/lookup?ref=${IDS.wTester}`).send();
  check("lookup?ref= hides test records from live keys", r.status === 404, r.json);
  r = await crm(LIVE, "GET", `/crymad-crm/v1/lookup?ref=nothing-here`).send();
  check("unknown ref is a 404", r.status === 404);

  section("Test environment isolation");
  r = await crm(TEST, "GET", `/crymad-crm/v1/customers/pz_partner:${IDS.tester}`).send();
  check("test keys see the test partner", r.status === 200 && r.json?.profile?.email === "joseph+crmtest1@pipzen.io", r.json);
  check("test lookup does not reveal the live referrer", r.json?.extras?.partner?.referred_by === null, r.json?.extras?.partner?.referred_by);
  {
    const tt = now() - 3;
    const path = `/crymad-crm/v1/customers/pz_partner:${IDS.tester}`;
    const liveRes = await crm(LIVE, "GET", path, undefined, {}, tt).send();
    const testRes = await crm(TEST, "GET", path, undefined, {}, tt).send();
    check("same content, same second, live and test: neither is taken for a replay", liveRes.status === 404 && testRes.status === 200, { live: liveRes.json, test: testRes.status });
  }
  r = await crm(TEST, "GET", `/crymad-crm/v1/customers/pz_partner:${IDS.alice}`).send();
  check("test keys cannot see live partners", r.status === 404, r.json);
  r = await crm(TEST, "GET", `/crymad-crm/v1/lookup?ref=${IDS.wTester}`).send();
  check("test keys can look up test records", r.status === 200, r.json);
  r = await crm(TEST, "GET", `/crymad-crm/v1/lookup?ref=${IDS.wAlicePending}`).send();
  check("test keys cannot look up live records", r.status === 404, r.json);

  section("Partner sessions before the lock");
  const bobCookie = await login("bob@example.com", "Partner-Pass-123");
  check("bob can sign in", Boolean(bobCookie));
  r = await request({ path: "/api/partner/withdrawals", cookie: bobCookie });
  check("bob's session works before the lock", r.status === 200, r.status);

  section("Actions");
  const lockPath = "/crymad-crm/v1/actions/lock_partner_account";
  const lockBody = (id, extra = {}) => ({ customer_external_id: `pz_partner:${id}`, reason: "Suspected account takeover", ticket_id: "tkt_1", agent_id: "agent_7", ...extra });
  r = await crm(LIVE, "POST", lockPath, lockBody(IDS.bob)).send();
  check("Idempotency-Key is required", r.status === 400 && r.json?.error?.code === "idempotency_key_required", r.json);
  r = await crm(LIVE, "POST", lockPath, { customer_external_id: "x" }, { "Idempotency-Key": randomUUID() }).send();
  check("invalid body is validation_failed with details", r.status === 400 && r.json?.error?.code === "validation_failed" && r.json.error.details?.length > 0, r.json);
  r = await crm(LIVE, "POST", "/crymad-crm/v1/actions/reset_challenge", lockBody(IDS.bob), { "Idempotency-Key": randomUUID() }).send();
  check("unknown action is a 404", r.status === 404 && r.json?.error?.code === "unknown_action", r.json);
  r = await crm(LIVE, "POST", lockPath, lockBody(IDS.bob, { dry_run: true }), { "Idempotency-Key": randomUUID() }).send();
  let bob = (await db.query(`SELECT status FROM users WHERE id=$1`, [IDS.bob])).rows[0];
  check("dry_run validates without changing anything", r.status === 200 && r.json?.status === "dry_run" && bob.status === "ACTIVE", { res: r.json, bob });
  r = await crm(LIVE, `POST`, `${lockPath}?dry_run=true`, lockBody(IDS.bob), { "Idempotency-Key": randomUUID() }).send();
  check("?dry_run=true works too", r.status === 200 && r.json?.status === "dry_run", r.json);
  const key = randomUUID();
  r = await crm(LIVE, "POST", lockPath, lockBody(IDS.bob), { "Idempotency-Key": key }).send();
  bob = (await db.query(`SELECT status FROM users WHERE id=$1`, [IDS.bob])).rows[0];
  const first = r.json;
  check("lock completes and locks the partner", r.status === 200 && first?.status === "completed" && bob.status === "BANNED", { res: first, bob });
  check("lock reports that the partner email was attempted", typeof first?.result?.partner_emailed === "boolean", first?.result);
  r = await crm(LIVE, "POST", lockPath, lockBody(IDS.bob), { "Idempotency-Key": key }).send();
  check("same key + same body returns the first result", r.status === 200 && JSON.stringify(r.json) === JSON.stringify(first) && r.headers["idempotent-replayed"] === "true", r.json);
  r = await crm(LIVE, "POST", lockPath, lockBody(IDS.bob, { reason: "Different reason" }), { "Idempotency-Key": key }).send();
  check("same key + different body is a 409", r.status === 409 && r.json?.error?.code === "idempotency_conflict", r.json);
  r = await crm(LIVE, "POST", lockPath, lockBody(IDS.bob), { "Idempotency-Key": randomUUID() }).send();
  check("locking a locked partner is already_applied", r.status === 200 && r.json?.status === "already_applied", r.json);
  r = await crm(LIVE, "POST", lockPath, lockBody(IDS.tester), { "Idempotency-Key": randomUUID() }).send();
  check("live keys cannot lock a test partner", r.status === 404 && r.json?.error?.code === "customer_not_found", r.json);
  r = await crm(TEST, "POST", lockPath, lockBody(IDS.tester, { dry_run: true }), { "Idempotency-Key": randomUUID() }).send();
  check("test keys can dry-run on the test partner", r.status === 200 && r.json?.status === "dry_run", r.json);
  const logRows = (await db.query(`SELECT count(*)::int n FROM crm_action_log`)).rows[0].n;
  check("every action call with a valid body is logged", logRows === 6, logRows);
  r = await crm(LIVE, "GET", `/crymad-crm/v1/customers/pz_partner:${IDS.bob}`).send();
  check("a locked partner shows restriction account_locked", r.json?.profile?.status === "locked" && r.json?.risk?.restrictions?.[0] === "account_locked", r.json?.risk);
  const restricted = await waitFor(async () => (await mockLog()).events.find((e) => e.type === "account.restricted" && e.customer_external_id === `pz_partner:${IDS.bob}`));
  check("account.restricted event reached the CRM (live)", restricted?.env === "live" && restricted.data.restrictions[0] === "account_locked" && restricted.key === restricted.id, restricted);

  section("Locked partner loses access");
  r = await request({ path: "/api/partner/withdrawals", cookie: bobCookie });
  check("an existing session stops working after the lock", r.status === 401, r.status);
  r = await request({ path: "/dashboard", cookie: bobCookie });
  check("portal pages redirect a locked partner", r.status === 307 && String(r.headers.location).includes("/login?error=banned"), { status: r.status, location: r.headers.location });
  check("a locked partner cannot sign in", (await login("bob@example.com", "Partner-Pass-123")) === null);

  section("Identity token");
  const aliceCookie = await login("alice@example.com", "Partner-Pass-123");
  check("alice can sign in", Boolean(aliceCookie));
  r = await request({ path: "/api/crymad-crm/identity-token", cookie: aliceCookie });
  const jwt1 = r.json?.token ? decodeJwt(r.json.token) : null;
  check("token issued with no-store", r.status === 200 && r.headers["cache-control"] === "no-store", r.status);
  check("header: HS256, JWT, kid of the live key", jwt1?.header?.alg === "HS256" && jwt1.header.typ === "JWT" && jwt1.header.kid === "kid_live_1", jwt1?.header);
  check("signature verifies with the live identity secret", jwt1?.valid("live-identity-secret-0123456789abcdef"));
  const c = jwt1?.claims ?? {};
  check("claims: iss, sub, email, email_verified, name", c.iss === "pipzen" && c.sub === `pz_partner:${IDS.alice}` && c.email === "alice@example.com" && c.email_verified === true && c.name === "Alice Partner", c);
  check("claims: exp is 15 minutes after iat", c.exp - c.iat === 900);
  check("claims: attrs tier partner, language en", c.attrs?.tier === "partner" && c.attrs.language === "en" && !("crymadx_user_id" in (c.attrs ?? {})), c.attrs);
  r = await request({ path: "/api/crymad-crm/identity-token", cookie: aliceCookie });
  check("every call gets a new jti", decodeJwt(r.json.token).claims.jti !== c.jti);
  r = await request({ path: "/api/crymad-crm/identity-token" });
  check("no session, no token", r.status !== 200, r.status);
  const testerCookie = await login("joseph+crmtest1@pipzen.io", "Partner-Pass-123");
  r = await request({ path: "/api/crymad-crm/identity-token", cookie: testerCookie });
  const jwtT = r.json?.token ? decodeJwt(r.json.token) : null;
  check("test partner gets a token signed with the test key", jwtT?.header?.kid === "kid_test_1" && jwtT.valid("test-identity-secret-0123456789abcdef"), jwtT?.header);

  section("Partner Support pages");
  r = await request({ path: "/support", cookie: aliceCookie });
  check("support page renders", r.status === 200 && r.text.includes("Your Tickets"), r.status);
  check("widget script and live key are on the page", r.text.includes("127.0.0.1:4555/widget/v1.js") && r.text.includes("pk_live_mockwidget") && !r.text.includes("pk_test_mockwidget"));
  const ticketKey = randomUUID();
  const newTicket = { subject: "Missing commission", category: "partner_commissions", message: "My commission for the September sale is missing." };
  r = await request({ method: "POST", path: "/api/partner/support/tickets", cookie: aliceCookie, body: newTicket, headers: { "Idempotency-Key": ticketKey } });
  const ticketId = r.json?.ticket?.id;
  check("partner can open a ticket", r.status === 200 && Boolean(ticketId), r.json);
  r = await request({ method: "POST", path: "/api/partner/support/tickets", cookie: aliceCookie, body: newTicket, headers: { "Idempotency-Key": ticketKey } });
  check("a retry with the same key returns the same ticket", r.json?.ticket?.id === ticketId, r.json);
  let log = await mockLog();
  const created = log.requests.filter((x) => x.method === "POST" && x.path === "/v1/tickets");
  const sent = created.length ? JSON.parse(created[0].body) : null;
  check("ticket sent with Bearer live key and Idempotency-Key", created[0]?.headers.authorization === "Bearer sk_live_mockkey" && String(created[0]?.headers["idempotency-key"]).startsWith(`pz-portal-${IDS.alice}-`), created[0]?.headers);
  check("ticket body per contract", sent?.customer?.external_id === `pz_partner:${IDS.alice}` && sent.customer.email === "alice@example.com" && sent.category === "partner_commissions" && sent.priority === "normal", sent);
  r = await request({ method: "POST", path: "/api/partner/support/tickets", cookie: aliceCookie, body: { subject: "x", category: "nope", message: "short" } });
  check("invalid ticket input is a 400", r.status === 400, r.json);
  r = await request({ path: `/support/${ticketId}`, cookie: aliceCookie });
  check("ticket page shows the conversation", r.status === 200 && r.text.includes("My commission for the September sale is missing."), r.status);
  r = await request({ method: "POST", path: `/api/partner/support/tickets/${ticketId}/messages`, cookie: aliceCookie, body: { message: "Adding the order date: 1 September." }, headers: { "Idempotency-Key": randomUUID() } });
  check("partner can reply", r.status === 200, r.json);
  r = await request({ path: "/api/partner/support/tickets", cookie: aliceCookie });
  check("ticket list API", r.status === 200 && r.json?.tickets?.some((x) => x.id === ticketId), r.json);
  const carolCookie = await login("carol@example.com", "Partner-Pass-123");
  r = await request({ path: `/support/${ticketId}`, cookie: carolCookie });
  check("another partner cannot open the ticket", r.status === 404, r.status);
  r = await request({ method: "POST", path: `/api/partner/support/tickets/${ticketId}/messages`, cookie: carolCookie, body: { message: "Not my ticket" } });
  check("another partner cannot reply to it", r.status === 404, r.json);
  r = await request({ method: "POST", path: "/api/partner/support/tickets", cookie: testerCookie, body: newTicket });
  log = await mockLog();
  const testTicket = log.requests.filter((x) => x.method === "POST" && x.path === "/v1/tickets").pop();
  check("a test partner's ticket goes to the test environment", r.status === 200 && testTicket?.headers.authorization === "Bearer sk_test_mockkey", testTicket?.headers);
  r = await request({ path: "/support", cookie: testerCookie });
  check("the test partner's page loads the test widget key", r.text.includes("pk_test_mockwidget") && !r.text.includes("pk_live_mockwidget"));

  section("Webhooks");
  const eventId = `evt_${randomUUID()}`;
  const msgPayload = { id: eventId, type: "message.created", data: { ticket: { id: ticketId, number: 1001, customer: { external_id: `pz_partner:${IDS.alice}` } }, message: { id: "m9", body: "<p>Hi Alice,<br>we found it &amp; fixed it.</p>", author_type: "agent" } } };
  const hook = webhook(LIVE, eventId, "message.created", msgPayload);
  r = await hook.send();
  check("signed webhook is acknowledged", r.status === 200 && r.json?.received === true && r.json.duplicate === false, r.json);
  const note = await waitFor(async () => (await db.query(`SELECT * FROM notifications WHERE "userId"=$1 AND type='MESSAGE'`, [IDS.alice])).rows[0]);
  check("agent reply becomes a partner notification (HTML stripped)", note?.title === "Pipzen Support replied" && note.message === "Ticket #1001: Hi Alice, we found it & fixed it." && note.data?.href === `/support/${ticketId}`, note);
  r = await hook.send();
  check("replaying the same signature is refused", r.status === 401 && r.json?.error?.code === "signature_replayed", r.json);
  r = await webhook(LIVE, eventId, "message.created", msgPayload).send();
  check("a retry (new signature, same event id) is a duplicate", r.status === 200 && r.json?.duplicate === true, r.json);
  const notes = (await db.query(`SELECT count(*)::int n FROM notifications WHERE "userId"=$1 AND type='MESSAGE'`, [IDS.alice])).rows[0].n;
  check("duplicates do not create a second notification", notes === 1, notes);
  const statusEvent = `evt_${randomUUID()}`;
  r = await webhook(LIVE, statusEvent, "ticket.status_changed", { data: { ticket: { id: ticketId, number: 1001, status: "waiting_on_customer", customer: { external_id: `pz_partner:${IDS.alice}` } } } }).send();
  const sysNote = await waitFor(async () => (await db.query(`SELECT * FROM notifications WHERE "userId"=$1 AND type='SYSTEM'`, [IDS.alice])).rows[0]);
  check("status change becomes a notification", r.status === 200 && sysNote?.message === "Ticket #1001 is now waiting on customer.", sysNote);
  const ownEvent = `evt_${randomUUID()}`;
  await webhook(LIVE, ownEvent, "message.created", { data: { ticket: { id: ticketId, customer: { external_id: `pz_partner:${IDS.alice}` } }, message: { body: "my own message", author_type: "customer" } } }).send();
  const ownRow = await waitFor(async () => (await db.query(`SELECT status FROM crm_webhook_events WHERE id=$1 AND status <> 'received'`, [`live:${ownEvent}`])).rows[0]);
  check("the partner's own messages do not notify them", ownRow?.status === "ignored", ownRow);
  const crossEvent = `evt_${randomUUID()}`;
  await webhook(LIVE, crossEvent, "message.created", { data: { ticket: { id: "t", customer: { external_id: `pz_partner:${IDS.tester}` } }, message: { body: "x", author_type: "agent" } } }).send();
  const crossRow = await waitFor(async () => (await db.query(`SELECT status FROM crm_webhook_events WHERE id=$1 AND status <> 'received'`, [`live:${crossEvent}`])).rows[0]);
  check("a live event about a test partner is ignored", crossRow?.status === "ignored", crossRow);
  r = await request({ method: "POST", path: "/api/crymad-crm/webhooks", body: "{}", headers: { "X-CMX-Signature": signedHeader(LIVE, (ts) => `${ts}.{}`) } });
  check("webhook without event headers is a 400", r.status === 400, r.json);
  r = await request({ method: "POST", path: "/api/crymad-crm/webhooks", body: "{}", headers: { "X-CMX-Signature": "t=1,v1=00", "X-CMX-Event-Id": "e", "X-CMX-Event-Type": "x" } });
  check("webhook with a bad signature is a 401", r.status === 401, r.json);

  section("Admin actions emit platform events");
  const adminCookie = await login("admin@pipzen.io", "Admin-Pass-123", "admin.pipzen.io");
  check("admin can sign in", Boolean(adminCookie));
  r = await request({ method: "PATCH", path: `/api/admin/partners/${IDS.bob}`, host: "admin.pipzen.io", cookie: adminCookie, body: { status: "ACTIVE" } });
  check("admin unlocks bob", r.status === 200, r.json);
  let ev = await waitFor(async () => (await mockLog()).events.find((e) => e.type === "account.unrestricted" && e.customer_external_id === `pz_partner:${IDS.bob}`));
  check("account.unrestricted sent", ev?.data?.source === "admin", ev);
  check("bob can sign in again", Boolean(await login("bob@example.com", "Partner-Pass-123")));
  r = await request({ method: "PATCH", path: `/api/admin/withdrawals/${IDS.wBobPending}`, host: "admin.pipzen.io", cookie: adminCookie, body: { status: "REJECTED", adminNote: "Bank details do not match" } });
  check("admin rejects a withdrawal", r.status === 200, r.json);
  ev = await waitFor(async () => (await mockLog()).events.find((e) => e.type === "withdrawal.failed"));
  check("withdrawal.failed sent with reason and amount string", ev?.data?.withdrawal_id === IDS.wBobPending && ev.data.amount === "25.00" && ev.data.reason === "Bank details do not match" && ev.data.reason_code === "rejected_by_admin", ev);
  r = await request({ method: "PUT", path: `/api/admin/partners/${IDS.carol}`, host: "admin.pipzen.io", cookie: adminCookie, body: { email: "carol.new@example.com", fullName: "Carol Renamed", status: "ACTIVE" } });
  check("admin edits carol", r.status === 200, r.json);
  ev = await waitFor(async () => (await mockLog()).events.find((e) => e.type === "security.changed"));
  check("security.changed sent for the email change", ev?.data?.change === "email_changed" && ev.customer_external_id === `pz_partner:${IDS.carol}`, ev);
  ev = await waitFor(async () => (await mockLog()).events.find((e) => e.type === "customer.updated" && e.customer_external_id === `pz_partner:${IDS.carol}`));
  check("customer.updated names changed fields without values", JSON.stringify(ev?.data?.fields) === JSON.stringify(["name"]) && !JSON.stringify(ev).includes("Carol Renamed"), ev);
  r = await request({ path: `/admin/partners?partner=${IDS.alice}`, host: "admin.pipzen.io", cookie: adminCookie });
  check("admin deep link page loads", r.status === 200, r.status);

  section("Outbox retries");
  await mockControl({ failEvents: 1 });
  r = await request({ method: "PUT", path: "/api/partner/profile", cookie: aliceCookie, body: { fullName: "Alice P.", phone: "+2348000000000" } });
  check("partner profile update succeeds while the CRM is down", r.status === 200, r.json);
  const pending = await waitFor(async () => (await db.query(`SELECT * FROM crm_outbox_events WHERE type='customer.updated' AND "customerExternalId"=$1 AND "lastError" IS NOT NULL`, [`pz_partner:${IDS.alice}`])).rows[0]);
  check("failed delivery stays queued with an error and a retry time", pending && pending.sentAt === null && pending.deadAt === null && pending.attempts === 1 && new Date(pending.nextAttemptAt) > new Date(pending.createdAt), pending);
  await db.query(`UPDATE crm_outbox_events SET "nextAttemptAt" = NOW() - INTERVAL '1 hour' WHERE id=$1`, [pending?.id]);
  const retried = await waitFor(async () => (await db.query(`SELECT * FROM crm_outbox_events WHERE id=$1 AND "sentAt" IS NOT NULL`, [pending?.id])).rows[0], 75_000, 2000);
  check("the background worker delivered it on retry", retried?.attempts === 2, retried);
  ev = (await mockLog()).events.filter((e) => e.id === pending?.id);
  check("the CRM received it exactly once", ev.length === 1, ev.length);

  console.log(`\n${passed} passed, ${failed} failed`);
  await db.end();
  process.exit(failed ? 1 : 0);
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
