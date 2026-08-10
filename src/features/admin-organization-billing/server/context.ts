import "server-only"

import type Stripe from "stripe"
import type { SupabaseClient } from "@supabase/supabase-js"

import {
  resolveStripeRuntimeConfigsForFallback,
  type StripeRuntimeConfig,
} from "@/lib/billing/stripe-runtime"
import type { Database, Json } from "@/lib/supabase"
import { supabaseErrorToError } from "@/lib/supabase/errors"

type ServerSupabase = SupabaseClient<Database, "public">

type SubscriptionRecord = {
  metadata: Json | null
  status: string
  stripe_customer_id: string | null
  stripe_subscription_id: string
  updated_at: string
  user_id: string
}

export type ResolvedAdminOrganizationBillingContext = {
  config: StripeRuntimeConfig
  record: SubscriptionRecord
  subscription: Stripe.Subscription
}

export type LatestAdminOrganizationBillingPayment = {
  charge: Stripe.Charge
  invoice: Stripe.Invoice
}

export class MissingLinkedStripeSubscriptionError extends Error {
  constructor() {
    super("The linked Stripe subscription was not found.")
    this.name = "MissingLinkedStripeSubscriptionError"
  }
}

function asMetadata(value: Json | null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function stripeErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Stripe request failed."
}

function isStripeResourceMissingError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "resource_missing"
  )
}

function orderConfigsByMode(configs: StripeRuntimeConfig[], mode: unknown) {
  if (mode !== "live" && mode !== "test") return configs
  return [
    ...configs.filter((config) => config.mode === mode),
    ...configs.filter((config) => config.mode !== mode),
  ]
}

export async function resolveAdminOrganizationBillingContext({
  orgId,
  supabase,
}: {
  orgId: string
  supabase: ServerSupabase
}): Promise<ResolvedAdminOrganizationBillingContext | null> {
  const { data: record, error } = await supabase
    .from("subscriptions")
    .select(
      "user_id, stripe_customer_id, stripe_subscription_id, status, metadata, updated_at"
    )
    .eq("user_id", orgId)
    .not("stripe_subscription_id", "ilike", "stub_%")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<SubscriptionRecord>()

  if (error) {
    throw supabaseErrorToError(error, "Unable to load organization billing.")
  }
  if (!record) return null

  const metadata = asMetadata(record.metadata)
  const configs = orderConfigsByMode(
    resolveStripeRuntimeConfigsForFallback({ preferTester: false }),
    metadata.stripe_mode
  )
  if (configs.length === 0) {
    throw new Error("Stripe billing is not configured.")
  }

  let lastError: unknown = null
  let everyLookupFailureWasMissing = true
  for (const config of configs) {
    try {
      const subscription = await config.client.subscriptions.retrieve(
        record.stripe_subscription_id
      )
      return { config, record, subscription }
    } catch (error) {
      lastError = error
      everyLookupFailureWasMissing =
        everyLookupFailureWasMissing && isStripeResourceMissingError(error)
    }
  }

  if (lastError && everyLookupFailureWasMissing) {
    throw new MissingLinkedStripeSubscriptionError()
  }

  throw new Error(
    `Unable to load the linked Stripe subscription. ${stripeErrorMessage(lastError)}`
  )
}

function invoiceSubscriptionId(invoice: Stripe.Invoice) {
  const subscription = invoice.parent?.subscription_details?.subscription
  return typeof subscription === "string" ? subscription : subscription?.id
}

export async function loadLatestAdminOrganizationBillingPayment({
  context,
}: {
  context: ResolvedAdminOrganizationBillingContext
}): Promise<LatestAdminOrganizationBillingPayment | null> {
  const customer = context.subscription.customer
  const customerId = typeof customer === "string" ? customer : customer.id
  const invoices = await context.config.client.invoices.list({
    customer: customerId,
    limit: 20,
    status: "paid",
  })
  const invoiceSummary = invoices.data.find(
    (invoice) =>
      invoice.amount_paid > 0 &&
      invoiceSubscriptionId(invoice) === context.subscription.id
  )
  if (!invoiceSummary) return null
  const invoiceId = invoiceSummary.id
  if (!invoiceId) return null

  const invoice = await context.config.client.invoices.retrieve(invoiceId)
  const invoicePayments = await context.config.client.invoicePayments.list({
    invoice: invoiceId,
    limit: 10,
    status: "paid",
  })
  const invoicePayment = invoicePayments.data.find(
    (payment) =>
      payment.payment.type === "payment_intent" ||
      payment.payment.type === "charge"
  )
  if (!invoicePayment) return null

  let chargeId: string | null = null
  if (invoicePayment.payment.type === "payment_intent") {
    const paymentIntentReference = invoicePayment.payment.payment_intent
    const paymentIntentId =
      typeof paymentIntentReference === "string"
        ? paymentIntentReference
        : paymentIntentReference?.id
    if (!paymentIntentId) return null

    const paymentIntent =
      await context.config.client.paymentIntents.retrieve(paymentIntentId)
    const latestCharge = paymentIntent.latest_charge
    chargeId =
      typeof latestCharge === "string"
        ? latestCharge
        : (latestCharge?.id ?? null)
  } else {
    const chargeReference = invoicePayment.payment.charge
    chargeId =
      typeof chargeReference === "string"
        ? chargeReference
        : (chargeReference?.id ?? null)
  }
  if (!chargeId) return null

  const charge = await context.config.client.charges.retrieve(chargeId)
  const chargeCustomer = charge.customer
  const chargeCustomerId =
    typeof chargeCustomer === "string" ? chargeCustomer : chargeCustomer?.id
  if (chargeCustomerId !== customerId || !charge.paid || charge.disputed) {
    return null
  }

  return { charge, invoice }
}

function normalizeSubscriptionStatus(
  status: Stripe.Subscription.Status
): Database["public"]["Enums"]["subscription_status"] {
  if (
    status === "trialing" ||
    status === "active" ||
    status === "past_due" ||
    status === "canceled" ||
    status === "incomplete" ||
    status === "incomplete_expired"
  ) {
    return status
  }
  return status === "unpaid" || status === "paused" ? "past_due" : "incomplete"
}

export function subscriptionCurrentPeriodEnd(
  subscription: Stripe.Subscription
) {
  const periodEnd = subscription.items.data[0]?.current_period_end
  return periodEnd ? new Date(periodEnd * 1000).toISOString() : null
}

export async function persistAdminOrganizationSubscriptionSnapshot({
  config,
  orgId,
  subscription,
  supabase,
}: {
  config: StripeRuntimeConfig
  orgId: string
  subscription: Stripe.Subscription
  supabase: ServerSupabase
}) {
  const customer = subscription.customer
  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: orgId,
      stripe_customer_id: typeof customer === "string" ? customer : customer.id,
      stripe_subscription_id: subscription.id,
      status: normalizeSubscriptionStatus(subscription.status),
      current_period_end: subscriptionCurrentPeriodEnd(subscription),
      cancel_at: subscription.cancel_at
        ? new Date(subscription.cancel_at * 1000).toISOString()
        : null,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      metadata: {
        ...subscription.metadata,
        stripe_mode: config.mode,
      },
    },
    { onConflict: "user_id,stripe_subscription_id" }
  )

  if (error) {
    throw supabaseErrorToError(
      error,
      "Stripe changed, but the application billing record did not update."
    )
  }
}
