// The partner portal with NO CryMad CRM keys (the state right after deploy):
// everything existing must keep working and the integration must stay off.
import http from "node:http";
import pg from "pg";

const PORT = Number(process.env.APP_PORT || 3101);
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
let passed = 0, failed = 0;
const check = (name, ok, detail) => {
  ok ? passed++ : failed++;
  console.log(`  ${ok ? "PASS" : "FAIL"} ${name}${!ok && detail !== undefined ? `\n       ${JSON.stringify(detail).slice(0, 400)}` : ""}`);
};

function request({ method = "GET", path, host = "partner.pipzen.io", headers = {}, body, cookie }) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? undefined : Buffer.from(typeof body === "string" ? body : JSON.stringify(body));
    const req = http.request({ host: "127.0.0.1", port: PORT, method, path, headers: {
      Host: host, ...(payload ? { "Content-Length": payload.length, "Content-Type": headers["Content-Type"] || "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}), ...headers } }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let json = null; try { json = JSON.parse(text); } catch {}
        resolve({ status: res.statusCode, headers: res.headers, text, json });
      });
    });
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function login(email, password, host = "partner.pipzen.io") {
  const csrf = await request({ path: "/api/auth/csrf", host });
  const cookie = (csrf.headers["set-cookie"] || []).map((c) => c.split(";")[0]).join("; ");
  const res = await request({ method: "POST", path: "/api/auth/callback/credentials", host, cookie,
    body: new URLSearchParams({ csrfToken: csrf.json.csrfToken, email, password, json: "true" }).toString(),
    headers: { "Content-Type": "application/x-www-form-urlencoded" } });
  const s = (res.headers["set-cookie"] || []).find((c) => c.startsWith("next-auth.session-token="));
  return s ? `${cookie}; ${s.split(";")[0]}` : null;
}

await db.connect();
for (let i = 0; i < 60; i++) { try { if ((await request({ path: "/login" })).status === 200) break; } catch {} await new Promise((r) => setTimeout(r, 1000)); }

console.log("\nIntegration stays off");
let r = await request({ path: "/crymad-crm/v1/manifest", headers: { "X-CMX-Signature": "t=1,v1=00" } });
check("CRM endpoints answer 503 not_configured", r.status === 503 && r.json?.error?.code === "not_configured", r.json);
r = await request({ method: "POST", path: "/api/crymad-crm/webhooks", body: "{}" });
check("webhook endpoint answers 503 not_configured", r.status === 503, r.json);
const alice = await login("alice@example.com", "Partner-Pass-123");
check("partner sign-in works", Boolean(alice));
r = await request({ path: "/api/crymad-crm/identity-token", cookie: alice });
check("identity token is 503 without keys", r.status === 503, r.json);
r = await request({ path: "/support", cookie: alice });
check("support page shows the email fallback", r.status === 200 && r.text.includes("support@pipzen.io") && !r.text.includes("widget/v1.js"), r.status);
r = await request({ path: "/dashboard", cookie: alice });
check("no widget script on portal pages", r.status === 200 && !r.text.includes("widget/v1.js"), r.status);
r = await request({ method: "POST", path: "/api/partner/support/tickets", cookie: alice, body: { subject: "Hello there", category: "partner_other", message: "A message long enough." } });
check("ticket API says support is by email", r.status === 503 && String(r.json?.error).includes("support@pipzen.io"), r.json);

console.log("\nExisting pages and APIs still work (partner)");
for (const path of ["/dashboard", "/network", "/earnings", "/withdrawals", "/campaigns", "/leaderboard", "/marketing", "/training", "/messages", "/notifications", "/settings", "/support"]) {
  r = await request({ path, cookie: alice });
  check(`GET ${path} is 200`, r.status === 200, r.status);
}
for (const path of ["/api/partner/withdrawals", "/api/partner/profile", "/api/partner/network", "/api/notifications"]) {
  r = await request({ path, cookie: alice });
  check(`GET ${path} is 200`, r.status === 200, r.status);
}
r = await request({ method: "POST", path: "/api/partner/withdrawals", cookie: alice, body: { amount: 10, method: "BANK", bankName: "GTBank", accountNumber: "0123456789", accountHolder: "Alice Partner" } });
check("partner can still request a withdrawal", r.status === 200, r.json);
r = await request({ method: "PUT", path: "/api/partner/profile", cookie: alice, body: { fullName: "Alice Partner", phone: "+2348000000001" } });
check("partner can still update their profile", r.status === 200, r.json);

console.log("\nExisting pages and APIs still work (admin)");
const admin = await login("admin@pipzen.io", "Admin-Pass-123", "admin.pipzen.io");
check("admin sign-in works", Boolean(admin));
for (const path of ["/admin", "/admin/partners", "/admin/purchases", "/admin/commissions", "/admin/withdrawals", "/admin/campaigns", "/admin/badges", "/admin/marketing", "/admin/training", "/admin/messages", "/admin/settings"]) {
  r = await request({ path, host: "admin.pipzen.io", cookie: admin });
  check(`GET ${path} is 200`, r.status === 200, r.status);
}
r = await request({ method: "PATCH", path: "/api/admin/withdrawals/cltestwbob000000000000001", host: "admin.pipzen.io", cookie: admin, body: { status: "REJECTED", adminNote: "Test" } });
check("admin can still reject a withdrawal", r.status === 200, r.json);
r = await request({ method: "PATCH", path: "/api/admin/partners/cltestcarol00000000000001", host: "admin.pipzen.io", cookie: admin, body: { status: "BANNED" } });
check("admin can still ban a partner", r.status === 200, r.json);
r = await request({ method: "PATCH", path: "/api/admin/partners/cltestcarol00000000000001", host: "admin.pipzen.io", cookie: admin, body: { status: "ACTIVE" } });
check("admin can still unban a partner", r.status === 200, r.json);

const tables = await db.query(`SELECT count(*)::int n FROM information_schema.tables WHERE table_name LIKE 'crm_%'`);
check("no crm_* tables are created while the integration is off", tables.rows[0].n === 0, tables.rows[0]);

console.log(`\n${passed} passed, ${failed} failed`);
await db.end();
process.exit(failed ? 1 : 0);
