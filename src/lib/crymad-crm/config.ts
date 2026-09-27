// CryMad CRM integration settings (contract v1.1). Everything is read from the
// environment at call time, so keys can be added or rotated without a rebuild.
// While a value is missing, the matching part of the integration stays off.
//
// Test and live are fully separate. Pipzen has no staging stack, so the
// sandbox runs on the live stack (contract section 10): test keys only ever
// see test partner accounts (email matching CRM_TEST_EMAIL_PATTERN) and live
// keys never see them.

export const CONTRACT_VERSION = "1.1";

export type CrmEnvironment = "live" | "test";
export const CRM_ENVIRONMENTS: CrmEnvironment[] = ["live", "test"];

export interface IdentityKey {
  kid: string;
  secret: string;
}

export interface CrmEnvironmentConfig {
  baseUrl: string;
  // Backend to CRM REST calls (sk_live_... / sk_test_...).
  secretApiKey: string;
  // Signs customer identity tokens. The first key signs; list the outgoing
  // key second during a rotation so the widget keeps working.
  identityKeys: IdentityKey[];
  // Verifies CRM webhooks, lookups and actions. Every listed secret is
  // accepted, which covers the 24 hour rotation overlap.
  webhookSecrets: string[];
  // Publishable widget key (pk_live_... / pk_test_...). Safe for the browser.
  widgetKey: string;
}

function list(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseIdentityKeys(name: string): IdentityKey[] {
  return list(process.env[name]).flatMap((entry) => {
    const sep = entry.indexOf(":");
    if (sep <= 0 || sep === entry.length - 1) {
      console.error(`[crymad-crm] Ignoring a malformed ${name} entry (expected kid:secret)`);
      return [];
    }
    return [{ kid: entry.slice(0, sep), secret: entry.slice(sep + 1) }];
  });
}

// A key whose prefix names the other environment is ignored, so a test key
// pasted into a live variable (or the reverse) can never reach real partners.
function prefixedKey(name: string, prefix: string) {
  const value = (process.env[name] ?? "").trim();
  if (!value) return "";
  if (!value.startsWith(prefix)) {
    console.error(`[crymad-crm] Ignoring ${name}: expected a key starting with ${prefix}`);
    return "";
  }
  return value;
}

function environmentConfig(env: CrmEnvironment): CrmEnvironmentConfig {
  const live = env === "live";
  const baseUrl = (live ? process.env.CRM_BASE_URL : process.env.CRM_TEST_BASE_URL || process.env.CRM_BASE_URL) ||
    "https://crm.crymadx.io";
  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
    secretApiKey: prefixedKey(live ? "CRM_SECRET_API_KEY" : "CRM_TEST_SECRET_API_KEY", live ? "sk_live_" : "sk_test_"),
    identityKeys: parseIdentityKeys(live ? "CRM_IDENTITY_SIGNING_KEYS" : "CRM_TEST_IDENTITY_SIGNING_KEYS"),
    webhookSecrets: list(live ? process.env.CRM_WEBHOOK_SECRETS : process.env.CRM_TEST_WEBHOOK_SECRETS),
    widgetKey: prefixedKey(live ? "CRM_WIDGET_KEY" : "CRM_TEST_WIDGET_KEY", live ? "pk_live_" : "pk_test_"),
  };
}

const DEFAULT_TEST_EMAIL_PATTERN = "\\+crmtest[^@]*@";

function testEmailPattern() {
  const source = process.env.CRM_TEST_EMAIL_PATTERN || DEFAULT_TEST_EMAIL_PATTERN;
  try {
    return new RegExp(source, "i");
  } catch {
    console.error("[crymad-crm] CRM_TEST_EMAIL_PATTERN is not a valid regular expression; using the default");
    return new RegExp(DEFAULT_TEST_EMAIL_PATTERN, "i");
  }
}

export function getCrmConfig() {
  return {
    platform: process.env.CRM_PLATFORM_SLUG || "pipzen",
    // Optional allowlist of CRM egress IPs / CIDR ranges.
    allowedIps: list(process.env.CRM_ALLOWED_IPS),
    adminBaseUrl: (process.env.CRM_ADMIN_BASE_URL || "https://admin.pipzen.io").replace(/\/+$/, ""),
    live: environmentConfig("live"),
    test: environmentConfig("test"),
  };
}

export function crmEnvironment(env: CrmEnvironment) {
  return environmentConfig(env);
}

// Which CRM environment a partner belongs to.
export function environmentForEmail(email: string): CrmEnvironment {
  return testEmailPattern().test(email) ? "test" : "live";
}

export function isCrmApiConfigured(env: CrmEnvironment) {
  return crmEnvironment(env).secretApiKey.length > 0;
}

export function isCrmIdentityConfigured(env: CrmEnvironment) {
  return crmEnvironment(env).identityKeys.length > 0;
}

export function configuredApiEnvironments() {
  return CRM_ENVIRONMENTS.filter(isCrmApiConfigured);
}

export function isCrmInboundConfigured() {
  const config = getCrmConfig();
  return config.live.webhookSecrets.length > 0 || config.test.webhookSecrets.length > 0;
}
