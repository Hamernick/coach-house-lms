# Infrastructure Cost Control And Self-Hosting Plan

- Status: active living plan
- Created: 2026-08-02
- Last reviewed: 2026-08-02
- Primary owner: platform engineering

## Retrieval Contract

Read this document first when work mentions infrastructure cost, scaling,
Vercel, Supabase, self-hosting, vendor replacement, hosting migration, or
disaster recovery.

Before acting:

1. Re-read `AGENTS.md`, `docs/RUNLOG.md`, the current monthly log, and
   `docs/agent/architecture-security.md`.
2. Refresh live usage, invoices, vendor pricing, and service capabilities.
3. Treat the dated numbers below as a baseline, not current truth.
4. Do not cut over production until every acceptance gate in this document
   passes and rollback has been rehearsed.

## Decision

Build an exit-ready hybrid platform first. Move Vercel production only after a
shadow deployment proves equivalent. Move Supabase only after its managed cost
exceeds a tested self-hosted replacement or control/compliance requires it.

Full self-hosting is not currently the lowest total-cost option. A one-server
deployment can reduce cash expense but loses redundancy, managed backups,
support, and safe deployment behavior. It is suitable for staging, not as the
production-equivalent target.

## Verified Baseline

Read-only production checks on 2026-08-02 returned:

| Metric                                           |   Result |
| ------------------------------------------------ | -------: |
| Supabase Auth records                            |      194 |
| Clearly synthetic/demo accounts                  |       11 |
| Real-email accounts explicitly marked as testers |       23 |
| Standard, not-obviously-synthetic accounts       |      160 |
| Non-synthetic accounts that have signed in       |       80 |
| Non-synthetic accounts with product activity     |       69 |
| Non-synthetic accounts never signed in           |      103 |
| Non-synthetic accounts still unconfirmed         |       95 |
| Database size                                    |  152 MiB |
| Stored objects                                   |      245 |
| Stored object volume                             | 3.04 GiB |
| Recent Supabase API operations                   |  128,244 |

Account classification rules:

- Clearly synthetic means a reserved test domain such as `example.com` or an
  account carrying the full-account seed marker.
- Marked tester means `profiles.is_tester` or compatible tester metadata. These
  23 accounts use real email domains and all have signed in, so they should be
  treated as real humans testing the product, not fake records.
- Not obviously synthetic is not the same as active, paid, or verified real.
  Imported, invited, dormant, and unconfirmed accounts remain in this group.
- Payment-record counts are not used as proof of live payment because Stripe
  test and live provenance require a separate verification.
- No account cleanup or deletion is authorized by this plan.

Repository surface audited on 2026-08-02:

- 162 Supabase migration files
- 53 application API route handlers
- 11 storage bucket names
- PostGIS resource-map queries
- Supabase Auth, RLS, Storage, signed URLs, Realtime presence/broadcast, REST,
  RPCs, and the hosted Management API
- Stripe, Resend, Mapbox, hCaptcha, Docuseal, OpenAI, Vercel telemetry, and a
  Google Calendar Cloud Run broker

## Target Architecture

```text
Cloudflare DNS, CDN, TLS, WAF
        |
Hetzner load balancer
        |
Next app A ---- Next app B
        |            |
        +--- Valkey shared cache and invalidation state
        |
Supabase-compatible API gateway
        |
GoTrue / PostgREST / Realtime / Storage / Supavisor
        |
Postgres + PostGIS primary ---- warm replica
        |
R2 live objects + encrypted off-provider database backups

GitHub Actions -> GHCR -> rolling deploys and preview environments
OpenTelemetry -> Grafana / Prometheus / Loki / Tempo
WireGuard-only administrative access
```

Infrastructure must be reproducible through OpenTofu and Ansible. Application
and service releases must use versioned container images, health checks,
automatic rollback, and an auditable deployment record. Kubernetes is deferred
until workload or team size proves it necessary.

## Service Decisions

| Service                | Decision                                                                                       |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| Vercel                 | First production migration candidate after shadow parity                                       |
| Supabase               | Keep managed now; build and rehearse an official self-hosted stack                             |
| Stripe                 | Keep; add ACH for appropriate high-value payments                                              |
| Mapbox                 | Keep current visuals; prototype MapLibre and owned tiles before map-load cost becomes material |
| Resend                 | Keep until email volume makes SES operationally worthwhile                                     |
| hCaptcha               | Keep while the required tier remains economical                                                |
| Google Calendar broker | Keep on Cloud Run initially to preserve credential isolation                                   |
| Docuseal               | Retire only after native signing is deployed, legally accepted, and production verified        |
| OpenAI                 | Keep internal/offline uses behind hard spend limits                                            |
| Cloudflare/R2          | Use for edge protection and S3-compatible object storage                                       |

Do not build a payment processor, outbound mail reputation network, CAPTCHA
network, or global mapping dataset. Those carry regulatory, fraud,
deliverability, or data-maintenance costs that exceed the infrastructure saved.

## Delivery Phases

### Phase 0: Measurement And Budgets

- Import three months of Vercel, Supabase, Mapbox, Resend, Cloud Run, OpenAI,
  Docuseal, and Stripe invoices and usage.
- Track cost per active user, authenticated user, API request, map load, email,
  storage GiB, and successful payment.
- Add monthly alerts and forecast thresholds.
- Establish initial SLOs: 99.9% availability, five-minute database RPO, and
  one-hour RTO.

### Phase 1: Application Portability

- Produce a standalone Next.js container.
- Replace `VERCEL_URL` assumptions with a canonical configured application URL.
- Export OpenTelemetry to a vendor-neutral collector.
- Implement shared Next.js cache and tag invalidation for multiple app nodes.
- Preserve streaming, ISR, Server Actions, image optimization, cron routes,
  webhooks, preview environments, and zero-downtime rollback.

### Phase 2: Vercel Shadow And Cutover

- Provision two application nodes and a load balancer.
- Deploy the same immutable image to Vercel and the shadow environment.
- Compare performance, cache behavior, logs, webhooks, background work, and
  failures under at least twice forecast peak load.
- Shift traffic gradually through Cloudflare.
- Retain Vercel for 30 days as a rollback target.

### Phase 3: Supabase-Compatible Staging

- Deploy the official self-hosted Supabase stack with production-matching
  Postgres and extensions.
- Use Supavisor transaction pooling and explicit connection limits.
- Restore a production clone and migrate Storage to an S3-compatible backend.
- Preserve Auth sessions where safely possible; otherwise plan controlled
  reauthentication.
- Recreate only the hosted Management API operations used by this repository:
  health, logs, SQL inspection, Auth configuration/templates, Storage
  visibility, and secrets. Do not recreate the whole Supabase platform.
- Enable `pg_stat_statements`, autovacuum monitoring, RLS performance checks,
  WAL archiving, point-in-time restore, and automatic restore verification.

### Phase 4: Supabase Cutover

- Lower DNS TTL and schedule a controlled write freeze.
- Take final database and object backups.
- Restore final data, sync object deltas, and verify counts and hashes.
- Switch API domains, environment variables, SMTP, webhooks, and monitoring.
- Run staff canaries before reopening writes.
- Retain the managed project read-only for 30 days.

### Phase 5: Vendor Optimization

- Introduce ACH where it improves payment economics without removing cards.
- Move Resend workloads to SES only after deliverability and webhook parity.
- Move Mapbox to MapLibre/owned tiles only after visual, attribution, geocoding,
  accessibility, and performance parity.
- Remove Docuseal only after the native signing legal and production gates pass.

## Required Acceptance Gates

- `pnpm check:quality` passes from a clean release artifact.
- Auth signup, verification, magic link, reset, refresh, signout, admin actions,
  and existing-session behavior pass.
- Final-schema RLS tests pass for anonymous, member, organization, coach,
  developer, and admin access.
- All storage buckets pass upload, download, signed URL, public URL, MIME, size,
  update, and deletion tests.
- Realtime cursor and workspace presence remain live and degrade safely.
- PostGIS `/find` queries and public-map caching remain correct.
- Stripe and Resend webhook signatures and idempotency remain correct.
- Google Calendar creation, updates, deletion, and Meet links pass.
- Multi-node cache invalidation cannot serve stale authorization-sensitive data.
- Load tests meet the repository LCP/TTI budgets at twice forecast peak.
- Backup restoration, primary failure, app-node failure, secret rotation, and
  rollback are rehearsed and timed.
- Independent external uptime monitoring and on-call alerts are active.

## Economic Trigger

Migrate a service when either condition is true:

1. Its three-month average bill exceeds twice the equivalent fixed
   infrastructure cost, including routine operations; or
2. Control, compliance, or availability requirements independently justify the
   migration.

Do not value engineering and on-call time at zero in the final comparison.

## Review And Update Protocol

Review monthly and immediately when:

- a vendor bill or forecast crosses an alert;
- MAU, egress, storage, map loads, email, or payment volume doubles;
- a material vendor pricing or product change occurs;
- a compliance, data-residency, or uptime requirement changes;
- a vendor outage exposes an untested dependency;
- self-hosted staging completes a backup or failover milestone.

On every review:

1. Update `Last reviewed`.
2. Replace the baseline with dated, verified measurements.
3. Record any changed decision below.
4. Append a summary to the current monthly runlog.

## Decision Log

| Date       | Decision                                                                                                                               |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-02 | Keep production managed, build portability and shadow infrastructure first, and use measured economic or control triggers for cutover. |

## Current External References

Reverify these before execution:

- Supabase pricing: <https://supabase.com/pricing>
- Supabase self-hosting: <https://supabase.com/docs/guides/self-hosting>
- Supabase platform restore: <https://supabase.com/docs/guides/self-hosting/restore-from-platform>
- Next.js self-hosting: <https://nextjs.org/docs/app/guides/self-hosting>
- Vercel pricing: <https://vercel.com/pricing>
- Cloudflare R2 pricing: <https://developers.cloudflare.com/r2/pricing/>
- Hetzner Cloud: <https://www.hetzner.com/cloud/>
- Mapbox pricing: <https://www.mapbox.com/pricing>
- Stripe pricing: <https://stripe.com/pricing>
- Resend pricing: <https://resend.com/pricing>
- Amazon SES pricing: <https://aws.amazon.com/ses/pricing/>
