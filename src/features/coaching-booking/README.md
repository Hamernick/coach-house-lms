# CoachingBooking Feature

Internal Coach House scheduling flow for `/coaching`.

## Ownership
- Meeting model: current booking UI offers one joint Joel + Paula coaching meeting; availability is the intersection of both coach calendars.
- Domain logic: `src/features/coaching-booking/lib/**`
- Server actions/queries: `src/features/coaching-booking/server/**`
- UI components: `src/features/coaching-booking/components/**`
- Hooks/controllers: `src/features/coaching-booking/hooks/**`

## Integrations
- Google Calendar: prefer the keyless Cloud Run broker (`GOOGLE_COACHING_BROKER_URL` / `GOOGLE_COACHING_BROKER_SECRET`) so Vercel never stores Google private keys. The legacy direct-key env path remains as a fallback for non-production sandboxes.
- Stripe: coaching full/discounted Price IDs from env; confirmation runs through the existing webhook idempotency table.
- Credits: confirmed bookings write `coaching_credit_ledger` rows; link opens no longer consume included coaching.

## Keyless Calendar Broker
- Source: `src/cloud-run/coaching-calendar-broker/**`
- Runtime identity: `coach-house-coaching-calendar@coach-house-496700.iam.gserviceaccount.com`
- Invoker identity: `vercel-broker-invoker@coach-house-496700.iam.gserviceaccount.com`
- Cloud Run service: `coach-house-calendar-broker` in `us-central1`
- Cloud Run URL: `https://coach-house-calendar-broker-5mzwtwiqsq-uc.a.run.app`
- Calendar auth: Cloud Run metadata token -> IAM Credentials `generateAccessToken` with `https://www.googleapis.com/auth/calendar`, or `signJwt` domain-wide delegation when per-coach impersonation env is set.
- Request auth: HMAC signature using `COACHING_CALENDAR_BROKER_SECRET`
- Cloud Run auth: Vercel OIDC -> Google Security Token Service -> IAM Credentials `generateIdToken`
- Calendar IDs: Joel `joel@coachhousesolutions.org`; Paula `paula@coachhousesolutions.org`
- Calendar access: with domain-wide delegation, set `GOOGLE_COACHING_JOEL_IMPERSONATED_USER=joel@coachhousesolutions.org` and `GOOGLE_COACHING_PAULA_IMPERSONATED_USER=paula@coachhousesolutions.org`; otherwise Joel/Paula calendars must be shared with the runtime service account using `Make changes to events`.
- Google Meet: Workspace Admin must authorize service account OAuth client `108309357260349792634` for scope `https://www.googleapis.com/auth/calendar` so the broker can create `hangoutsMeet` conference data as the coach user.

Main-app Vercel env for private Cloud Run:
- `GOOGLE_COACHING_GCP_PROJECT_NUMBER`
- `GOOGLE_COACHING_WORKLOAD_IDENTITY_POOL_ID`
- `GOOGLE_COACHING_WORKLOAD_IDENTITY_PROVIDER_ID`
- `GOOGLE_COACHING_INVOKER_SERVICE_ACCOUNT_EMAIL`

Current GCP defaults:
- `GOOGLE_COACHING_GCP_PROJECT_NUMBER=74627119265`
- `GOOGLE_COACHING_WORKLOAD_IDENTITY_POOL_ID=vercel`
- `GOOGLE_COACHING_WORKLOAD_IDENTITY_PROVIDER_ID=vercel`
- `GOOGLE_COACHING_INVOKER_SERVICE_ACCOUNT_EMAIL=vercel-broker-invoker@coach-house-496700.iam.gserviceaccount.com`

Do not enable live production booking until the two coach calendars have been shared with the runtime service account and matching Vercel env is set for the main app.

## Rules
- Keep route files in `src/app/**` as composition-only wrappers over this feature.
- Import other features only through their public entrypoint (`@/features/<name>`).
- Keep `lib/**` pure: no React, no UI imports, no route imports.
- Keep `server/**` free of UI/component imports.
- Keep shared UI in `src/components/ui/**`; avoid one-off primitives here.
- Keep acceptance coverage in `tests/acceptance/coaching-booking.test.ts`.
- Add acceptance tests for user-visible behavior before merging.
