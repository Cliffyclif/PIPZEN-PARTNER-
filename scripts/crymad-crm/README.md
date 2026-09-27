# CryMad CRM integration tests

Checks for the CryMad CRM integration (contract 1.1). Nothing here touches production.

## Unit checks

```bash
npm run test:crm
```

Signature parsing and verification, IP allowlists, and message text handling.

## End-to-end checks

These need a local PostgreSQL database whose name ends in `_test`. The seed script refuses any other database.

1. Point `DATABASE_URL` at the local test database and load the schema:
   ```bash
   export DATABASE_URL="postgresql://user:pass@localhost:5432/pipzen_test"
   npx prisma db push
   ```
2. Start the mock CRM: `node scripts/crymad-crm/mock-crm.mjs` (port 4555).
3. Seed: `node scripts/crymad-crm/seed-test-data.cjs`. It also drops the `crm_*` tables, so the run checks that the app creates them itself.
4. Build and start the portal with test keys on port 3100:
   ```bash
   export NEXTAUTH_SECRET="local-test" NEXTAUTH_URL="http://localhost:3100" RESEND_API_KEY="re_invalid"
   export CRM_BASE_URL="http://127.0.0.1:4555"
   export CRM_SECRET_API_KEY="sk_live_mockkey" CRM_WIDGET_KEY="pk_live_mockwidget"
   export CRM_IDENTITY_SIGNING_KEYS="kid_live_1:live-identity-secret-0123456789abcdef"
   export CRM_WEBHOOK_SECRETS="whsec_live_new,whsec_live_old"
   export CRM_TEST_SECRET_API_KEY="sk_test_mockkey" CRM_TEST_WIDGET_KEY="pk_test_mockwidget"
   export CRM_TEST_IDENTITY_SIGNING_KEYS="kid_test_1:test-identity-secret-0123456789abcdef"
   export CRM_TEST_WEBHOOK_SECRETS="whsec_test_1"
   npm run build && npx next start -p 3100
   ```
5. Run `node scripts/crymad-crm/e2e.mjs`.

For the "integration off" regression check, reseed, then start a second server on port 3101 with no `CRM_*` variables and run `APP_PORT=3101 node scripts/crymad-crm/e2e-unconfigured.mjs`.

`RESEND_API_KEY` must be an invalid key during tests, so the lock action cannot email anyone.
