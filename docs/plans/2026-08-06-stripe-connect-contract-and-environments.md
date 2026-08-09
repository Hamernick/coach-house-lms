# Stripe Connect Contract and Environments

Date: 2026-08-06
Status: Research 6 complete; superseded for the current Finance drawer scope
Scope: independent-organization Connect accounts, direct-charge Payment Links,
webhooks, environments, SDK/CLI compatibility, and Batch 6 proof
Non-goals: Finance UI, sponsored fundraising, Stripe configuration changes,
sandbox/live object creation, database writes, or production changes

## 2026-08-07 Product Override

This document is retained as discarded payment-processing research. It is not
implementation authority for the current Finance drawer.

The approved current scope does not create Stripe accounts, Products, Prices,
Payment Links, charges, refunds, transfers, payouts, campaigns, public
fundraising pages, or in-app money movement. Stripe is optional external data:
after a separately approved authorization flow, Coach House may read a bounded
transaction history, classify relevant income explicitly, and store a private
display record. It never assumes every Stripe charge is a donation.

CSV is the default provider-independent import path. A Stripe account is not a
Finance prerequisite.

For the later optional Stripe sync, prefer a Stripe App using the default
`platform` authentication method. Stripe documents platform authentication for
apps that want fewer keys per install; OAuth is mainly useful when users must
manage the integration from the external software. Stripe's published pricing
does not list a separate OAuth authorization charge, but payment and Connect
products can carry their own fees. Coach House does not need Connect or money
movement for this read-only display scope.

## 2026-08-08 Authorization Update

The product owner approved the optional Stripe source. Implement it as a public
data-integration Stripe App using platform authentication and an install link,
not OAuth or Connect account provisioning.

- Request only `balance_read`.
- Store the signed installed account ID, mode, explicit income classification,
  sync state, and immutable provider evidence. Never store a user API key,
  access token, refresh token, customer description, or raw Stripe payload.
- The first manual sync reads at most 90 days and 500 balance transactions.
  Later syncs overlap one day and rely on provider-ID idempotency.
- Import positive charge-like activity only under the member's explicit
  Donation, Grant, Earned revenue, or Other income classification. Keep fees
  and refunds separate; skip unsupported balance movements.
- Provider-authenticated Stripe records are verified immediately through an
  atomic service-only transition and may contribute to Raised. Stripe remains
  the payment processor; Coach House never creates or moves money.
- Live use remains gated on uploading the manifest, creating an external test
  or published install link, registering the exact callback, and configuring
  the app signing secret plus mode-matched platform secret key.

All sections below predate this override.

## Decision

Use the Accounts v1 API with explicit controller properties for the first
implementation. Create a full-Dashboard connected account for each independent
legal recipient and use only connected-account direct charges. The connected
account owns its Product, Price, Payment Link, PaymentIntent, Charge, fee,
refund, dispute, balance, and payout.

The required controller configuration is:

```ts
{
  fees: { payer: "account" },
  losses: { payments: "stripe" },
  requirement_collection: "stripe",
  stripe_dashboard: { type: "full" },
}
```

Do not set the legacy `type`, use OAuth, create an application fee, use
`transfer_data` or `on_behalf_of`, or let Coach House initiate independent
account refunds, transfers, or payouts. Stripe requires the full-Dashboard
configuration to pair Stripe-collected fees and Stripe loss liability. It gives
the legal recipient its own Dashboard for requirements, reports, refunds,
disputes, payment settings, and payouts.

Accounts v2 is not required for this release. Mixing v1 snapshot events and v2
thin account events would add a second object and event model without improving
the direct-charge requirement. Re-evaluate v2 only as a separately tested
migration.

## Current Repository Evidence

| Item                         | Current state                 |
| ---------------------------- | ----------------------------- |
| `stripe` dependency          | `18.5.0`                      |
| Pinned request API version   | `2025-08-27.basil`            |
| Current stable `stripe`      | `22.4.0`, observed 2026-08-06 |
| Current stable API in SDK    | `2026-07-29.dahlia`           |
| Installed Stripe CLI         | `1.23.3`                      |
| CLI update reported locally  | `1.45.1`                      |
| Existing Stripe route        | Platform subscriptions only   |
| Existing Connect persistence | None                          |
| Existing Connect secret      | None                          |
| Existing Connect UI          | None                          |

The installed SDK types already accept all four controller properties,
`card_payments` and `transfers`, Account Links, custom-unit Prices, Payment
Links, and per-request `stripeAccount` context. The current package is four
major versions behind the stable SDK and no longer receives fixes.

Before Batch 6 implementation, upgrade the SDK and CLI in an isolated
compatibility slice. Pin the SDK-generated API version, create the Connect event
destination at that same version, and rerun every existing subscription,
checkout, webhook, refund, and admin-billing test. Do not silently change the
existing billing API version inside the Connect feature.

## Account and Country Contract

Provisioning requires an authenticated owner with `finance_connect`, one active
organization, a confirmed legal entity, and a confirmed legal country. The
database uniqueness boundary is organization, legal recipient, Stripe platform
account, and environment.

The repository has no approved target-country list. Therefore:

- the executable fixture uses `US` and `usd` as a baseline, not a global claim;
- live provisioning stays disabled unless the country is explicitly allowlisted
  for the platform and sandbox-proved;
- never infer legal country from a map address or user location;
- check Stripe platform/Connect availability, Country Spec, presentment and
  settlement currency, and requested capabilities before account creation;
- request only `card_payments` and `transfers` for the initial direct-charge
  card flow; add country-specific methods only after separate capability proof;
- require both capabilities active plus `details_submitted`, `charges_enabled`,
  and `payouts_enabled` before campaign activation.

Stripe notes that full-Dashboard accounts receive some capabilities
automatically by country, but direct card payments require `card_payments` and
`transfers`. The server still records the returned capability states instead of
assuming test-mode behavior proves live eligibility.

Prefill only user-confirmed legal country, organization name, website or product
description, and support email. Never collect or store identity documents,
representative identity data, bank details, or Stripe login credentials.

## Onboarding Contract

Use an Account Link with `type: "account_onboarding"`. `account_update` is not
available to full-Dashboard accounts. The connected account updates existing
information in its Stripe Dashboard and returns to onboarding only for newly due
requirements.

Rules:

1. Build `return_url` and `refresh_url` from one configured environment origin,
   never the request Host header.
2. Allow HTTP only for localhost testing. Preview and live URLs require HTTPS
   and exact route allowlists.
3. Tie each return/refresh flow to an authenticated owner and a short-lived,
   single-use, hashed local intent for organization, account, and environment.
4. Redirect immediately to the Account Link. Never return it to unrelated UI,
   persist it, log it, email it, text it, place it in analytics, or create a rich
   preview.
5. Refresh creates a new link only after reauthorizing the same persisted
   account. It never provisions another account.
6. Return means the user exited the flow, including Save for later. Retrieve the
   Account and capabilities in account context; never mark onboarding complete
   from the redirect alone.
7. Persist only sanitized readiness, requirement field names, disabled reason,
   capability states, environment, and synchronization time.

## Campaign and Payment Link Contract

Create Product, one-time Price, and Payment Link with the persisted connected
account ID in the SDK request options. Retrieve, update, deactivate, and
reconcile those objects with the same `stripeAccount` context. A platform-level
object with matching metadata is invalid.

The donor-selected amount uses a one-time Price with:

```ts
{
  currency: "usd",
  custom_unit_amount: {
    enabled: true,
    minimum: 100,
    maximum: 99999999,
    preset: 2500,
  },
}
```

These numbers prove the request shape only; they are not approved product limits.
Campaign bounds are integer minor units and must also satisfy Stripe's minimum
charge for the selected currency. Stripe does not support recurring
pay-what-you-want or recurring donations. The Payment Link uses
`submit_type: "donate"`, one line item with quantity one, connected branding,
and no application-fee, `on_behalf_of`, or `transfer_data` fields.

Metadata is correlation evidence only. Before applying money, cross-check the
top-level event account, environment, Product, Price, Payment Link, campaign,
PaymentIntent, currency, amount mode, and local ownership mapping.

## Connect Event Destination

Create a dedicated event destination configured for **Connected accounts**.
Keep it separate from `/api/stripe/webhook`, its signing secret, event inbox,
tables, logs, alerts, replay tool, and API-version lifecycle.

Use v1 snapshot events for the first implementation. Verify the signature from
the untouched raw body, require a top-level connected `account`, verify
`livemode` against the persisted connection, durably insert/claim the event, and
then return `2xx`. Processing is asynchronous, idempotent, and order-independent.

Subscribe only to:

| Events                                                                                                                                           | Purpose                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| `account.updated`, `capability.updated`, `account.application.deauthorized`, `account.external_account.updated`                                  | Readiness, requirements, disconnect, payout-account remediation |
| `payment_link.updated`                                                                                                                           | Tracked link active/inactive state                              |
| `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`    | Session correlation and delayed Checkout state                  |
| `payment_intent.processing`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled`                              | Canonical donation lifecycle                                    |
| `charge.succeeded`, `charge.updated`                                                                                                             | Charge and balance-transaction enrichment                       |
| `refund.created`, `refund.updated`, `refund.failed`                                                                                              | Refund lifecycle by Refund ID                                   |
| `charge.dispute.created`, `charge.dispute.updated`, `charge.dispute.funds_withdrawn`, `charge.dispute.funds_reinstated`, `charge.dispute.closed` | Dispute status and financial effects                            |
| `payout.failed`                                                                                                                                  | Account remediation only; never campaign spending               |

Only `payment_intent.succeeded` creates the gross donation effect.
Checkout events correlate the session; Charge events enrich the same donation.
A successful Refund creates one negative effect per Refund ID. Dispute money
effects come from funds-withdrawn and funds-reinstated transitions, not merely
the open/closed label. Payouts never change campaign raised or restricted-fund
totals.

Deduplicate at both levels:

- delivery: Stripe Event ID;
- semantic effect: connected account plus event family, object ID, financial
  transition, and balance-transaction ID where present.

Stripe doesn't guarantee event order and can send the same event or equivalent
object events more than once. A newer local state must never be replaced by an
older event. Missing or contradictory objects enter reconciliation; they do not
guess or post money.

## Environments and Secrets

Extend the validated runtime with exactly two Connect webhook variables:

```text
STRIPE_CONNECT_WEBHOOK_SECRET
STRIPE_TEST_CONNECT_WEBHOOK_SECRET
```

Reuse the existing server-only Stripe API keys. Webhook signing secrets are not
API keys. Do not expose either in `NEXT_PUBLIC_*`, logs, error responses, source,
fixtures, response-inbox attachments, or analytics.

| Runtime         | API key                      | Connect signing secret               | Required behavior                                 |
| --------------- | ---------------------------- | ------------------------------------ | ------------------------------------------------- |
| Local           | `STRIPE_TEST_SECRET_KEY`     | CLI-issued local secret              | Sandbox/test objects only; localhost return URLs  |
| Preview         | `STRIPE_TEST_SECRET_KEY`     | `STRIPE_TEST_CONNECT_WEBHOOK_SECRET` | Dedicated sandbox endpoint and preview HTTPS URLs |
| Production test | Test event on production app | Production Connect endpoint secret   | Persist in isolated test partition; never public  |
| Production live | `STRIPE_SECRET_KEY`          | `STRIPE_CONNECT_WEBHOOK_SECRET`      | Live connections and exact production HTTPS URLs  |

Connect runtime selection never falls back from a missing test key to a live
key. Preview fails closed on `sk_live_`, live connected accounts, live events,
or production return URLs. Production live fails closed on sandbox connection
IDs. Every Stripe ID record carries platform account, environment, and
`livemode`; cross-environment foreign keys are invalid.

Stripe production Connect endpoints can receive both live and test events, so
`livemode` is mandatory even after signature verification. Each Stripe sandbox
requires its own event destination and secret. Prefer a dedicated Stripe
sandbox because test-mode settings can affect live settings while sandbox
settings are isolated.

## Local and Sandbox Proof

Upgrade the CLI first, then confirm flags again:

```bash
brew upgrade stripe/stripe-cli/stripe
stripe version
stripe login
stripe listen \
  --events account.updated,capability.updated,payment_link.updated,checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed,payment_intent.processing,payment_intent.succeeded,payment_intent.payment_failed,payment_intent.canceled,charge.succeeded,charge.updated,refund.created,refund.updated,refund.failed,charge.dispute.created,charge.dispute.updated,charge.dispute.funds_withdrawn,charge.dispute.funds_reinstated,charge.dispute.closed,payout.failed \
  --forward-connect-to localhost:3000/api/stripe/connect/webhook
stripe trigger payment_intent.succeeded --stripe-account acct_TEST
stripe trigger payment_intent.payment_failed --stripe-account acct_TEST
stripe trigger checkout.session.async_payment_succeeded --stripe-account acct_TEST
stripe trigger charge.refunded --stripe-account acct_TEST
stripe trigger charge.dispute.created --stripe-account acct_TEST
stripe trigger payment_link.updated --stripe-account acct_TEST
stripe trigger account.updated --stripe-account acct_TEST
stripe trigger payout.updated --stripe-account acct_TEST
```

The installed CLI supports `--forward-connect-to` and `--stripe-account`, but
its canned triggers don't cover every required event exactly. Use canned events
for parser/inbox tests, API-created sandbox objects for real lifecycle tests,
and event resend for replay:

```bash
stripe events resend evt_TEST --webhook-endpoint we_TEST
```

Never run deauthorization, refund, dispute, or payout-failure drills against a
live account. Sandbox capability states can be less strict than live, so a
successful sandbox payment is not country/capability approval.

The source-backed request and behavior fixture is
`tests/fixtures/stripe-connect/research-contract.json`. Required proof includes:

- typed account, Account Link, Price, Payment Link, and request-context fixtures;
- explicit absence of `type`, OAuth, application fees, `transfer_data`, and
  `on_behalf_of`;
- retry and concurrent account provisioning;
- expired, reused, abandoned, refreshed, and incomplete onboarding;
- connected direct charge, delayed success/failure, refund, dispute, and payout
  failure;
- invalid signature, wrong account/mode/currency/link, duplicate delivery,
  equivalent duplicate, out-of-order delivery, partial failure, replay, and
  reconciliation;
- local, preview, production-test, and production-live isolation;
- unrelated connected-account revenue excluded from campaign totals.

## Release Gates

Batch 6 cannot launch until:

1. the SDK/CLI upgrade and existing Stripe billing compatibility suite pass;
2. platform Connect activation and each launch country are manually confirmed;
3. the exact controller request and forbidden fields are asserted;
4. every object request is proved to use connected-account context;
5. owner/admin allow and every other role deny;
6. raw-body signature, environment, account ownership, duplicate, ordering,
   replay, and reconciliation tests pass;
7. one isolated sandbox completes onboarding, direct donation, delayed payment,
   refund, dispute, and remediation journeys;
8. final-schema RLS, donor privacy, audit, monitoring, and rollback review pass;
9. no production key, account, event, or object was used during local/preview
   proof.

## Primary Sources

- [Stripe controller-property migration](https://docs.stripe.com/connect/migrate-to-controller-properties)
- [Stripe SaaS Dashboard access](https://docs.stripe.com/connect/saas/tasks/dashboard)
- [Stripe account capabilities](https://docs.stripe.com/connect/account-capabilities)
- [Stripe-hosted onboarding](https://docs.stripe.com/connect/hosted-onboarding)
- [Stripe direct charges](https://docs.stripe.com/connect/direct-charges)
- [Stripe Payment Links with Connect](https://docs.stripe.com/connect/payment-links)
- [Stripe Price custom unit amounts](https://docs.stripe.com/api/prices/create)
- [Stripe Connect webhooks](https://docs.stripe.com/connect/webhooks)
- [Stripe webhook delivery behavior](https://docs.stripe.com/webhooks)
- [Stripe event types](https://docs.stripe.com/api/events/types)
- [Stripe Connect testing](https://docs.stripe.com/connect/testing)
- [Stripe sandboxes](https://docs.stripe.com/sandboxes)
- [Stripe API-key practices](https://docs.stripe.com/keys-best-practices)
- [Stripe Node changelog](https://github.com/stripe/stripe-node/blob/master/CHANGELOG.md)
