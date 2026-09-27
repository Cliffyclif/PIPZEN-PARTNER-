import { randomUUID } from "crypto";
import type { User } from "@prisma/client";
import { crmEnvironment, getCrmConfig, type CrmEnvironment } from "./config";
import { signJwtHs256 } from "./crypto";
import { toExternalId } from "./customer";

// Customer identity token for the chat widget (contract section 3): HS256, at
// most 60 minutes. We use 15 so a lock or sign-out takes effect quickly.
export const IDENTITY_TOKEN_TTL_SECONDS = 15 * 60;

export function issueIdentityToken(
  env: CrmEnvironment,
  user: Pick<User, "id" | "email" | "fullName" | "status" | "passwordHash">
) {
  const key = crmEnvironment(env).identityKeys[0];
  if (!key) throw new Error(`No identity signing key is configured for the ${env} environment`);

  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + IDENTITY_TOKEN_TTL_SECONDS;
  const token = signJwtHs256(
    { alg: "HS256", typ: "JWT", kid: key.kid },
    {
      iss: getCrmConfig().platform,
      sub: toExternalId(user.id),
      email: user.email,
      // Partners register through an invitation link sent to this address.
      email_verified: user.status !== "INVITED" && user.passwordHash !== null,
      name: user.fullName || user.email,
      iat,
      exp,
      jti: randomUUID(),
      attrs: { tier: "partner", language: "en" },
    },
    key.secret
  );
  return { token, expiresAt: new Date(exp * 1000).toISOString() };
}
