// Seeds a LOCAL test database with partners, purchases, commissions and
// withdrawals for the CryMad CRM tests. It wipes tables first, so it refuses
// to run against anything but a local database whose name ends in "_test".
const bcrypt = require("bcryptjs");
const { Client } = require("pg");

const target = new URL(process.env.DATABASE_URL || "postgresql://invalid");
if (!["localhost", "127.0.0.1"].includes(target.hostname) || !target.pathname.endsWith("_test")) {
  console.error("Refusing to seed: DATABASE_URL must point to a local database whose name ends in _test");
  process.exit(1);
}

const ids = {
  admin: "cltestadmin00000000000001",
  alice: "cltestalice00000000000001",
  bob: "cltestbob0000000000000001",
  carol: "cltestcarol00000000000001",
  tester: "cltesttester0000000000001",
  invited: "cltestinvited000000000001",
  purchase: "cltestpurchase00000000001",
  purchase2: "cltestpurchase00000000002",
  comBob: "cltestcombob0000000000001",
  comAlice: "cltestcomalice00000000001",
  comAlice2: "cltestcomalice00000000002",
  wAliceApproved: "cltestwalice0000000000001",
  wAlicePending: "cltestwalice0000000000002",
  wBobPending: "cltestwbob000000000000001",
  wTester: "cltestwtester000000000001",
  badge: "cltestbadge00000000000001",
  award: "cltestaward00000000000001",
};

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const hash = await bcrypt.hash("Partner-Pass-123", 10);
  const adminHash = await bcrypt.hash("Admin-Pass-123", 10);
  const t = (s) => new Date(s);

  await c.query(`DROP TABLE IF EXISTS crm_replay_guard, crm_webhook_events, crm_outbox_events, crm_idempotency_keys, crm_action_log`);
  await c.query(`TRUNCATE users, purchases, commissions, withdrawals, badges, badge_awards, notifications, messages, settings CASCADE`);

  const users = [
    [ids.admin, "admin@pipzen.io", adminHash, "ADMIN", "ACTIVE", "Pipzen Admin", null, "ADMIN001", true, "2025-01-01T10:00:00Z"],
    [ids.alice, "alice@example.com", hash, "PARTNER", "ACTIVE", "Alice Partner", null, "ALICE001", true, "2025-02-01T10:00:00Z"],
    [ids.bob, "bob@example.com", hash, "PARTNER", "ACTIVE", "Bob Partner", ids.alice, "BOB00001", true, "2025-03-01T10:00:00Z"],
    [ids.carol, "carol@example.com", hash, "PARTNER", "ACTIVE", "Carol Partner", ids.bob, "CAROL001", true, "2025-04-01T10:00:00Z"],
    [ids.tester, "joseph+crmtest1@pipzen.io", hash, "PARTNER", "ACTIVE", "Crm Tester", ids.alice, "TEST0001", true, "2025-05-01T10:00:00Z"],
    [ids.invited, "invited@example.com", null, "PARTNER", "INVITED", null, ids.alice, null, false, "2025-06-01T10:00:00Z"],
  ];
  for (const [id, email, ph, role, status, name, ref, code, done, created] of users) {
    await c.query(
      `INSERT INTO users (id, email, "passwordHash", role, status, "fullName", "referrerId", "referralCode", "profileCompleted",
        "inviteToken", "inviteTokenExpiry", phone, "pipzenReferralLink", "lastLoginAt", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$15)`,
      [id, email, ph, role, status, name, ref, code, done,
       status === "INVITED" ? "invite-token-123" : null,
       status === "INVITED" ? t("2030-01-01T00:00:00Z") : null,
       "+2348000000000", `https://pipzen.io/?ref=${code ?? "none"}`,
       status === "ACTIVE" ? t("2026-09-20T09:00:00Z") : null, t(created)]
    );
  }

  await c.query(
    `INSERT INTO purchases (id, "userId", amount, "packageName", "packageType", "purchasedAt", "seededById", "createdAt")
     VALUES ($1,$2,$3,$4,'EVALUATION',$5,$6,$5), ($7,$8,$9,$10,'INSTANT_FUNDING',$11,$6,$11)`,
    [ids.purchase, ids.carol, "500.00", "$50K X-1 Step", t("2026-09-01T12:00:00Z"), ids.admin,
     ids.purchase2, ids.alice, "400.00", "$10K Instant Funded X", t("2026-09-05T12:00:00Z")]
  );
  const coms = [
    [ids.comBob, ids.purchase, ids.bob, ids.carol, 1, "6.00", "30.00", "PAID", "2026-09-01T12:00:01Z"],
    [ids.comAlice, ids.purchase, ids.alice, ids.carol, 2, "3.00", "15.00", "PAID", "2026-09-01T12:00:02Z"],
    [ids.comAlice2, ids.purchase2, ids.alice, ids.alice, 1, "6.00", "24.00", "PENDING", "2026-09-05T12:00:01Z"],
  ];
  for (const [id, pid, earner, buyer, level, rate, amt, status, created] of coms) {
    await c.query(
      `INSERT INTO commissions (id, "purchaseId", "earnerId", "buyerId", level, rate, "commissionAmount", status, "createdAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [id, pid, earner, buyer, level, rate, amt, status, t(created)]
    );
  }
  // Extra paid commission so Alice has a real balance.
  await c.query(
    `INSERT INTO commissions (id, "purchaseId", "earnerId", "buyerId", level, rate, "commissionAmount", status, "createdAt")
     VALUES ('cltestcomalice00000000003', $1, $2, $3, 1, '6.00', '120.10', 'PAID', $4)`,
    [ids.purchase, ids.alice, ids.carol, t("2026-09-02T08:00:00Z")]
  );

  const ws = [
    [ids.wAliceApproved, ids.alice, "50.00", "BANK", "GTBank", "0123456789", "Alice Partner", null, null, null, "APPROVED", "2026-09-10T09:00:00Z"],
    [ids.wAlicePending, ids.alice, "40.00", "CRYPTO", null, null, null, "TQ1abcdefghijklmnopqrstuvwxyz9XYZ", "USDT", "TRC20", "PENDING", "2026-09-20T08:00:00Z"],
    [ids.wBobPending, ids.bob, "25.00", "BANK", "Access", "9876543210", "Bob Partner", null, null, null, "PENDING", "2026-09-21T08:00:00Z"],
    [ids.wTester, ids.tester, "10.00", "BANK", "Kuda", "1111222233", "Crm Tester", null, null, null, "PENDING", "2026-09-22T08:00:00Z"],
  ];
  for (const [id, uid, amt, method, bank, acct, holder, wallet, ctype, net, status, at] of ws) {
    await c.query(
      `INSERT INTO withdrawals (id, "userId", amount, method, "bankName", "accountNumber", "accountHolder", "walletAddress",
        "cryptoType", "cryptoNetwork", status, "requestedAt", "processedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [id, uid, amt, method, bank, acct, holder, wallet, ctype, net, status, t(at), status === "APPROVED" ? t(at) : null]
    );
  }

  await c.query(
    `INSERT INTO badges (id, name, description, "referralThreshold", "rewardAmount", "isActive", "createdAt")
     VALUES ($1, 'Bronze Network', 'First 10 referrals', 10, '50.00', true, now())`,
    [ids.badge]
  );
  await c.query(`INSERT INTO badge_awards (id, "userId", "badgeId", "awardedAt") VALUES ($1,$2,$3,$4)`,
    [ids.award, ids.alice, ids.badge, t("2026-08-01T00:00:00Z")]);
  await c.query(`INSERT INTO settings (id, key, value, label, type, "updatedAt") VALUES ('clset1','min_withdrawal','10','Min withdrawal','number', now())`);

  const counts = await c.query(`SELECT (SELECT count(*) FROM users) u, (SELECT count(*) FROM commissions) c, (SELECT count(*) FROM withdrawals) w`);
  console.log("seeded", counts.rows[0]);
  await c.end();
})().catch((e) => { console.error(e); process.exit(1); });
