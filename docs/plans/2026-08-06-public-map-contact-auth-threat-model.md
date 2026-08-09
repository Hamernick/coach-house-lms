# Public Map Contact, Auth Replay, and Rate-Limit Contract

Date: 2026-08-06
Status: Research 5, contact/privacy half verified
Scope: `/find` contact visibility, payload redaction, auth replay, and abuse controls
Non-goals: location retention, NWS policy, cooling-center UX, production mutation

## Decision

`/find` needs three contact classes instead of the current `is_public` boolean:

1. `public_service_access`: an emergency hotline, intake line, or provider contact
   deliberately published so anyone can obtain a service. It remains anonymous and
   available from an on-demand resource detail response.
2. `authenticated_representative`: an organization representative contact with
   explicit organization opt-in and evidence. It is omitted from every anonymous
   response and revealed only through an authenticated, audited endpoint.
3. `private`: personal, internal, safety-sensitive, donor, beneficiary, minor,
   volunteer, caseworker, or unclassified contact data. It is never public.

Unclassified contacts default to `private`. Authentication alone never makes an
unclassified contact revealable.

## Measured Current State

Read-only production aggregates on 2026-08-06 found:

| Measure                                                         | Count |
| --------------------------------------------------------------- | ----: |
| Public resource contacts                                        |   897 |
| Private resource contacts                                       |   166 |
| Public phones                                                   |   625 |
| Public emails                                                   |   272 |
| Public platform organizations                                   |    16 |
| Platform organizations carrying representative names and emails |    16 |
| Platform organizations carrying phones                          |    15 |

No contact values were printed or copied into this report. Resource-contact
metadata contains only source/import keys; it does not record purpose, audience,
consent, classification, or expiry.

The current anonymous transport exposes more than the UI needs:

- The local explicit preview returned 5,046 items; 2,961 items contained 3,231
  contacts.
- The current production endpoint returned 500 items; 348 items contained 413
  contacts.
- `resource_map_public_items` filters contacts with `is_public`, but
  `resource-map-public-item-adapter.ts` copies every selected contact onto each
  item and `/api/public/resource-map/items` keeps those contacts in its anonymous,
  publicly cached JSON.
- `public-map-index.ts` reads public organizations with a service client and sends
  representative name, email, and phone to the client. The organization detail
  turns them into Contact, Email, and Call actions.
- Raw `resource_map_contacts` rows have forced RLS and an administrator policy.
  Private rows are not exposed by the public view. This is a useful control, but
  the public projection is too broad.
- Contact links already pass through an explicit scheme allowlist. Keep that
  control.

## Assets and Trust Boundaries

Assets:

- representative and safety-sensitive contact data;
- deliberately public provider intake availability;
- saved items, notes, lists, and restored map context;
- session, pending-intent, and idempotency secrets;
- coarse location and exact location;
- contact classification evidence and audit history.

Trust boundaries:

1. Anonymous HTML, RSC payloads, JSON, CDN caches, search indexes, and crawlers.
2. Browser map state, local storage, query parameters, and the auth sheet.
3. Supabase Auth session verification.
4. Protected Next.js route handlers and server actions.
5. Service-role database access, RLS-protected tables, storage, logs, and caches.

## Threat Model

| Threat actor           | Goal                                  | Current path                                                          | Severity                                                                        | Required control                                                                   |
| ---------------------- | ------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Anonymous scraper      | Harvest contacts at scale             | One cached initial JSON response contains values                      | High for representative or personal contacts; low for intentional public intake | Minimal list/marker projection; detail-on-demand; classification before projection |
| New-account harvester  | Bulk reveal protected contacts        | No protected reveal boundary or distributed limiter exists            | High                                                                            | Authenticated reveal, consent recheck, shared atomic limits, audit                 |
| Malicious link sender  | Cause an action after login           | Unsigned `auth_action` and `auth_org` query values replay client-side | Medium                                                                          | Signed short-lived intent, one-time consume, canonical ID validation               |
| ID manipulator         | Save or reveal another/invalid object | Preference API accepts bounded strings without object validation      | Medium                                                                          | Object-level authorization and publication checks for every ID                     |
| Crawler                | Consume or index protected data       | Anonymous payload is crawlable and cacheable                          | High for protected values                                                       | Values absent from HTML/RSC/JSON; authenticated POST; `no-store`                   |
| Legitimate help seeker | Reach an urgent service quickly       | Public intake data exists but is bundled into the whole catalog       | Availability risk if over-gated                                                 | Never auth-gate intentional emergency/provider intake contacts                     |
| Operator or developer  | Diagnose abuse                        | No reveal event or deny reason exists                                 | Medium                                                                          | Value-free immutable audit events and observable limiter decisions                 |

Critical severity is reserved for a contact flaw combined with account/session
takeover or a cross-tenant private-data dump. The currently verified standalone
exposure is high where representative or personal contacts enter anonymous
payloads.

## Attacker Stories

1. An anonymous client downloads one catalog response and extracts every phone and
   email without opening a detail panel. Remove all contact values from list,
   marker, search, HTML, and RSC projections.
2. A user creates accounts or rotates network addresses to reveal every protected
   representative contact. Recheck classification and consent, then enforce user,
   IP-risk, and unique-contact limits in shared storage.
3. A link sets `auth_action=save&auth_org=<arbitrary value>`. After authentication,
   the browser persists it without an expiry or server validation. Replace this
   with an allowlisted, signed intent consumed once by the server.
4. A stale public flag leaves a reassigned personal number visible. Require source
   evidence, verification timestamps, and deterministic expiry/review rules.
5. A reveal route logs or caches the value. Use POST, `Cache-Control: no-store`,
   value-free structured logs, and no value in URLs, analytics, errors, or cache
   keys.

## Data Contract

Add explicit classification evidence to contact records or an append-only contact
classification table:

- `visibility`: `public_service_access | authenticated_representative | private`;
- `purpose`: `hotline | intake | general_service | representative`;
- authoritative provider source URL or internal consent record;
- `classified_by`, `classified_at`, `last_verified_at`, and optional
  `review_after`;
- immutable classification-change history.

Migration rules:

- Keep all 166 currently private contacts private.
- Do not blanket-hide the 897 currently public contacts: most are food pantry,
  library, meal, or shelter access contacts. Audit deterministic source cohorts
  against provider evidence and classify them by purpose.
- Treat named/direct/personal and ambiguous contacts as private until reviewed.
- Reclassify platform-organization representative fields separately; the current
  16 organizations require explicit opt-in before authenticated reveal.

## Response Contracts

### Marker, list, and search

Return no contact value. Allowed fields are boolean capability hints such as
`hasPublicServiceContact` and `hasProtectedRepresentativeContact`.

### Public resource detail

Return only verified `public_service_access` contacts on demand. Emergency and
provider intake access remains anonymous. Use the existing URL-scheme allowlist.

### Protected representative reveal

Use an authenticated same-origin `POST /api/public/map/contact-reveal` with a
canonical contact ID and idempotency key. The server must:

1. verify the session and request origin/CSRF contract;
2. enforce shared rate limits before disclosing object existence;
3. recheck object publication, classification, current consent, and caller policy;
4. return the minimum value with `Cache-Control: private, no-store`;
5. write a value-free audit event;
6. return the same generic denial for missing, private, stale, or unauthorized IDs.

Audit fields: actor ID, contact/resource/organization ID, action, result, deny
reason, coarse risk bucket, idempotency key, and UTC timestamp. Never log the raw
contact value, email, phone, IP address, session token, or signed intent.

## Pending Auth Intent

Replace `auth_action`, `auth_org`, and client-side replay with a signed or opaque
server-issued intent:

- 10-minute expiry;
- allowlisted action and canonical object ID;
- internal `/find` destination only;
- safe filters, slug, drawer state, and coarse viewport only;
- no contact value, secret URL, arbitrary return URL, or exact user location;
- authenticated server-side single consume and idempotent retry;
- publication and authorization rechecked at consume time;
- expired/invalid intents restore safe context and ask the user to retry.

Move authenticated map lists/items from mutable auth metadata into typed,
RLS-scoped tables. Validate every saved object ID. Merge guest saves explicitly and
idempotently after authentication.

## Bootstrap Rate Limits

There is no current reveal telemetry and no reusable distributed application
limiter. These are enforce-now safety floors, not invented steady-state demand:

| Operation                           |  User limit | IP-risk limit |                        Additional limit |
| ----------------------------------- | ----------: | ------------: | --------------------------------------: |
| Protected reveal attempts           | 40 / 10 min |  160 / 10 min |                   Generic denial counts |
| Successful unique protected reveals | 20 / 10 min |   80 / 10 min | 100 / user / 24 h; 400 / IP-risk / 24 h |
| Save/list/note replay and mutations | 60 / 10 min |  240 / 10 min |        One-time intent plus idempotency |

The 20-reveal floor lets a legitimate member access all 16 currently measured
platform-organization contacts in one session. Attempt and success buckets are
separate so invalid-ID enumeration consumes capacity. Identical idempotent retries
do not consume a second success.

Implementation requirements:

- atomic shared Supabase RPC-backed sliding window or token bucket;
- key by user/action plus an HMAC-derived, rotating IP-risk hash; never store raw
  IP addresses;
- short retention and observable allow/deny reasons;
- `429` with `Retry-After`; do not reveal whether the object exists;
- fail closed with a safe `503` for protected reveals if the limiter is unavailable;
- public emergency/provider intake contacts remain unaffected;
- no process-memory limiter and no hCaptcha.

Collect 14 days of value-free shadow telemetry alongside enforcement. Then set the
reviewed limit no lower than the safety floor and no lower than three times the
observed legitimate p99 10-minute volume. Record the owner, date, evidence window,
shared-network effects, and rollback threshold.

## Security Invariants and Tests

- Anonymous marker/list/search/HTML/RSC/JSON contains zero protected contact
  values.
- Public detail returns only currently verified public-service contacts.
- Protected reveal requires auth, current consent, publication, object-level
  authorization, a limiter decision, `no-store`, and a value-free audit event.
- Private or unclassified contacts cannot be inferred through status, timing, or
  error-copy differences.
- Pending intents expire, are one-time, contain no sensitive state, and cannot
  redirect outside `/find`.
- Save/reveal retries are idempotent; invalid IDs never persist.
- Signed-out, expired-intent, denied-action, shared-IP, limit-exhaustion,
  limiter-outage, and crawler fixtures are required.
- Source-family backfill reports exact classified, unclassified, stale, and
  quarantined counts without printing values.

## Release Gates

Batch 5 contact/auth work cannot ship until:

1. the contact-purpose migration and review policy are approved;
2. anonymous payload tests prove protected values are absent;
3. protected reveal, audit, one-time intent, and atomic shared limits pass;
4. the 897 current public contacts have deterministic classification evidence or
   remain quarantined;
5. the 16 platform organizations explicitly opt in before representative reveal;
6. location, NWS, and cooling-center research completes separately.

## Primary Guidance

- [OWASP API6: Unrestricted Access to Sensitive Business Flows](https://owasp.org/API-Security/editions/2023/en/0xa6-unrestricted-access-to-sensitive-business-flows/)
- [OWASP API4: Unrestricted Resource Consumption](https://owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/)
- [OWASP API1: Broken Object Level Authorization](https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/)
- [OWASP REST Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html)
- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- [Vercel Functions](https://vercel.com/docs/functions)
