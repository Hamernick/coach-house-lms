import { readFileSync } from "node:fs"
import Stripe from "stripe"
import { describe, expect, it } from "vitest"

const FIXTURE_PATH = "tests/fixtures/stripe-connect/research-contract.json"

const accountCreate = {
  business_profile: {
    name: "Fixture Organization",
    url: "https://example.org",
  },
  business_type: "non_profit",
  capabilities: {
    card_payments: { requested: true },
    transfers: { requested: true },
  },
  controller: {
    fees: { payer: "account" },
    losses: { payments: "stripe" },
    requirement_collection: "stripe",
    stripe_dashboard: { type: "full" },
  },
  country: "US",
  email: "finance@example.org",
} satisfies Stripe.AccountCreateParams

const accountLinkCreate = {
  account: "acct_fixture",
  collection_options: { fields: "eventually_due" },
  refresh_url: "https://preview.example.org/api/stripe/connect/refresh",
  return_url: "https://preview.example.org/api/stripe/connect/return",
  type: "account_onboarding",
} satisfies Stripe.AccountLinkCreateParams

const priceCreate = {
  currency: "usd",
  custom_unit_amount: {
    enabled: true,
    maximum: 99_999_999,
    minimum: 100,
    preset: 2_500,
  },
  product: "prod_fixture",
} satisfies Stripe.PriceCreateParams

const paymentLinkCreate = {
  line_items: [{ price: "price_fixture", quantity: 1 }],
  metadata: {
    campaign_id: "campaign_fixture",
    schema_version: "1",
  },
  submit_type: "donate",
} satisfies Stripe.PaymentLinkCreateParams

const connectedRequest = {
  idempotencyKey: "finance:campaign_fixture:payment_link:v1",
  stripeAccount: "acct_fixture",
} satisfies Stripe.RequestOptions

type ResearchFixture = {
  account: {
    baselineCountry: string
    controller: typeof accountCreate.controller
    forbiddenFields: string[]
  }
  accountLink: {
    persistUrl: boolean
    type: string
  }
  apiFamily: string
  cases: Array<{ expected: string; id: string }>
  currentStable: {
    apiVersion: string
    stripeCli: string
    stripeNode: string
  }
  environments: Array<{
    apiKey: string
    id: string
    livemode: boolean
    secret: string
  }>
  eventDestination: {
    canonicalGrossEvent: string
    deliveryDedupe: string
    events: string[]
    payloadStyle: string
    source: string
  }
  installed: {
    apiVersion: string
    stripeCli: string
    stripeNode: string
  }
  paymentLink: {
    forbiddenFields: string[]
    requestContext: string
    submitType: string
  }
  price: {
    recurringCustomAmountSupported: boolean
    type: string
  }
  schemaVersion: number
  secrets: string[]
}

function readFixture() {
  return JSON.parse(readFileSync(FIXTURE_PATH, "utf8")) as ResearchFixture
}

describe("Stripe Connect Research 6 contract", () => {
  it("compiles the exact Accounts v1 controller and onboarding request", () => {
    const fixture = readFixture()

    expect(fixture.apiFamily).toBe("v1")
    expect(accountCreate.controller).toEqual(fixture.account.controller)
    expect(accountCreate.capabilities).toEqual({
      card_payments: { requested: true },
      transfers: { requested: true },
    })
    expect(accountCreate.country).toBe(fixture.account.baselineCountry)
    expect(accountCreate).not.toHaveProperty("type")
    expect(accountCreate).not.toHaveProperty("external_account")
    expect(accountCreate).not.toHaveProperty("tos_acceptance")
    expect(fixture.accountLink).toMatchObject({
      persistUrl: false,
      type: "account_onboarding",
    })
    expect(accountLinkCreate.type).toBe("account_onboarding")
  })

  it("compiles donor-selected Price and direct Payment Link requests", () => {
    const fixture = readFixture()

    expect(priceCreate).toMatchObject({
      currency: "usd",
      custom_unit_amount: {
        enabled: true,
        minimum: 100,
        preset: 2_500,
      },
    })
    expect(priceCreate).not.toHaveProperty("recurring")
    expect(paymentLinkCreate).toMatchObject({
      line_items: [{ price: "price_fixture", quantity: 1 }],
      submit_type: "donate",
    })
    for (const field of fixture.paymentLink.forbiddenFields) {
      expect(paymentLinkCreate).not.toHaveProperty(field)
    }
    expect(fixture.price).toMatchObject({
      recurringCustomAmountSupported: false,
      type: "one_time",
    })
    expect(connectedRequest.stripeAccount).toBe("acct_fixture")
    expect(fixture.paymentLink.requestContext).toBe("stripeAccount")
  })

  it("locks one dedicated connected-account snapshot event matrix", () => {
    const fixture = readFixture()
    const events = new Set(fixture.eventDestination.events)

    expect(fixture.eventDestination).toMatchObject({
      canonicalGrossEvent: "payment_intent.succeeded",
      deliveryDedupe: "event_id",
      payloadStyle: "snapshot",
      source: "connected_accounts",
    })
    expect(events.size).toBe(24)
    expect(events).toEqual(
      new Set([
        "account.updated",
        "capability.updated",
        "account.application.deauthorized",
        "account.external_account.updated",
        "payment_link.updated",
        "checkout.session.completed",
        "checkout.session.async_payment_succeeded",
        "checkout.session.async_payment_failed",
        "checkout.session.expired",
        "payment_intent.processing",
        "payment_intent.succeeded",
        "payment_intent.payment_failed",
        "payment_intent.canceled",
        "charge.succeeded",
        "charge.updated",
        "refund.created",
        "refund.updated",
        "refund.failed",
        "charge.dispute.created",
        "charge.dispute.updated",
        "charge.dispute.funds_withdrawn",
        "charge.dispute.funds_reinstated",
        "charge.dispute.closed",
        "payout.failed",
      ])
    )
  })

  it("separates secrets, modes, and current compatibility evidence", () => {
    const fixture = readFixture()
    const environments = Object.fromEntries(
      fixture.environments.map((environment) => [environment.id, environment])
    )

    expect(fixture.installed).toEqual({
      apiVersion: "2025-08-27.basil",
      stripeCli: "1.23.3",
      stripeNode: "18.5.0",
    })
    expect(fixture.currentStable).toEqual({
      apiVersion: "2026-07-29.dahlia",
      stripeCli: "1.45.1",
      stripeNode: "22.4.0",
    })
    expect(fixture.secrets).toEqual([
      "STRIPE_CONNECT_WEBHOOK_SECRET",
      "STRIPE_TEST_CONNECT_WEBHOOK_SECRET",
    ])
    expect(environments.preview).toMatchObject({
      apiKey: "STRIPE_TEST_SECRET_KEY",
      livemode: false,
    })
    expect(environments.production_live).toMatchObject({
      apiKey: "STRIPE_SECRET_KEY",
      livemode: true,
    })
    expect(fixture.cases).toHaveLength(24)
    expect(new Set(fixture.cases.map(({ id }) => id)).size).toBe(24)
  })
})
