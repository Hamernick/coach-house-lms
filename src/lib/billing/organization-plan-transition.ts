import "server-only"

import { createHash } from "node:crypto"
import type { SupabaseClient } from "@supabase/supabase-js"
import Stripe from "stripe"

import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import type { Database } from "@/lib/supabase/types"
import type {
  StripeBillingPlanTier,
  StripeRuntimeConfig,
} from "@/lib/billing/stripe-runtime"

const ACTIVE_LIKE_STATUSES = new Set<Stripe.Subscription.Status>([
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "paused",
  "incomplete",
])

const CHANGEABLE_STATUSES = new Set<Stripe.Subscription.Status>([
  "active",
  "trialing",
  "past_due",
])

type LocalSubscriptionReference = {
  stripe_subscription_id: string
}

export type OrganizationSubscriptionState = {
  subscriptions: Stripe.Subscription[]
}

export type OrganizationSubscriptionSnapshot = {
  status: Database["public"]["Enums"]["subscription_status"]
  metadata: Record<string, string>
  current_period_end: string | null
  cancel_at: string | null
  canceled_at: string | null
  stripe_customer_id: string
  stripe_subscription_id: string
}

export type OrganizationPlanTransitionResult =
  | { kind: "checkout"; url: string; sessionId: string }
  | { kind: "unchanged"; subscription: Stripe.Subscription }
  | { kind: "updated"; subscription: Stripe.Subscription }
  | {
      kind: "blocked"
      code:
        | "duplicate_subscriptions"
        | "subscription_not_changeable"
        | "subscription_canceling"
        | "subscription_shape_invalid"
    }

function planName(planTier: StripeBillingPlanTier) {
  return planTier === "operations_support"
    ? "Operations Support"
    : "Organization"
}

function safeSearchValue(value: string) {
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(value)) {
    throw new Error("Invalid organization billing identifier.")
  }
  return value
}

function configuredPriceIds(config: StripeRuntimeConfig) {
  return new Set(
    [config.organizationPriceId, config.operationsSupportPriceId].filter(
      (value): value is string => Boolean(value)
    )
  )
}

function belongsToOrganizationSubscription({
  subscription,
  orgId,
  localIds,
  priceIds,
}: {
  subscription: Stripe.Subscription
  orgId: string
  localIds: Set<string>
  priceIds: Set<string>
}) {
  const metadataOwner =
    subscription.metadata.org_user_id ?? subscription.metadata.user_id ?? null
  const hasConfiguredPrice = subscription.items.data.some((item) =>
    priceIds.has(item.price.id)
  )
  const locallyLinked = localIds.has(subscription.id)
  const ownerMatches = metadataOwner === orgId
  const locallyLinkedWithoutConflictingOwner = locallyLinked && !metadataOwner

  return (
    ACTIVE_LIKE_STATUSES.has(subscription.status) &&
    (ownerMatches || locallyLinkedWithoutConflictingOwner) &&
    (subscription.metadata.kind === "organization" || hasConfiguredPrice)
  )
}

async function loadLocalSubscriptionReferences({
  supabase,
  orgId,
}: {
  supabase: SupabaseClient<Database, "public">
  orgId: string
}) {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("user_id", orgId)
    .not("stripe_subscription_id", "ilike", "stub_%")
    .order("created_at", { ascending: false })
    .limit(25)

  if (error) {
    throw new Error("Unable to verify the linked subscription.")
  }

  return (data ?? []) as LocalSubscriptionReference[]
}

async function retrieveLocalSubscriptions({
  client,
  localIds,
}: {
  client: Stripe
  localIds: Set<string>
}) {
  const subscriptions: Stripe.Subscription[] = []

  for (const subscriptionId of localIds) {
    try {
      subscriptions.push(await client.subscriptions.retrieve(subscriptionId))
    } catch (error) {
      const stripeError = error as Stripe.errors.StripeError
      if (stripeError.code !== "resource_missing") throw error
    }
  }

  return subscriptions
}

async function searchOrganizationSubscriptions({
  client,
  orgId,
}: {
  client: Stripe
  orgId: string
}) {
  const owner = safeSearchValue(orgId)
  const queries = [
    `metadata['org_user_id']:'${owner}'`,
    `metadata['user_id']:'${owner}'`,
  ]
  const results = await Promise.all(
    queries.map((query) => client.subscriptions.search({ query, limit: 100 }))
  )

  return results.flatMap((result) => result.data)
}

export async function resolveOrganizationSubscriptionState({
  supabase,
  config,
  orgId,
}: {
  supabase: SupabaseClient<Database, "public">
  config: StripeRuntimeConfig
  orgId: string
}): Promise<OrganizationSubscriptionState> {
  const localReferences = await loadLocalSubscriptionReferences({
    supabase,
    orgId,
  })
  const localIds = new Set(
    localReferences.map((reference) => reference.stripe_subscription_id)
  )
  const [localSubscriptions, searchedSubscriptions] = await Promise.all([
    retrieveLocalSubscriptions({ client: config.client, localIds }),
    searchOrganizationSubscriptions({ client: config.client, orgId }),
  ])
  const deduped = new Map<string, Stripe.Subscription>()

  for (const subscription of [
    ...localSubscriptions,
    ...searchedSubscriptions,
  ]) {
    deduped.set(subscription.id, subscription)
  }

  const priceIds = configuredPriceIds(config)
  const subscriptions = [...deduped.values()]
    .filter((subscription) =>
      belongsToOrganizationSubscription({
        subscription,
        orgId,
        localIds,
        priceIds,
      })
    )
    .sort((left, right) => right.created - left.created)

  return { subscriptions }
}

export function buildPlanTransitionIdempotencyKey({
  orgId,
  planTier,
  attempt,
}: {
  orgId: string
  planTier: StripeBillingPlanTier
  attempt: string
}) {
  const digest = createHash("sha256")
    .update(`${orgId}:${planTier}:${attempt}`)
    .digest("hex")
  return `coachhouse_plan_${digest}`
}

function subscriptionMetadata({
  subscription,
  userId,
  orgId,
  planTier,
  config,
  extra,
}: {
  subscription?: Stripe.Subscription
  userId: string
  orgId: string
  planTier: StripeBillingPlanTier
  config: StripeRuntimeConfig
  extra?: Record<string, string>
}) {
  return {
    ...(subscription?.metadata ?? {}),
    kind: "organization",
    user_id: userId,
    org_user_id: orgId,
    planName: planName(planTier),
    plan_tier: planTier,
    stripe_mode: config.mode,
    ...extra,
  }
}

function toStoredStatus(
  status: Stripe.Subscription.Status
): Database["public"]["Enums"]["subscription_status"] {
  if (
    status === "active" ||
    status === "trialing" ||
    status === "past_due" ||
    status === "incomplete" ||
    status === "incomplete_expired" ||
    status === "canceled"
  ) {
    return status
  }
  return "past_due"
}

function timestampIso(value: number | null | undefined) {
  return typeof value === "number" ? new Date(value * 1000).toISOString() : null
}

export function toOrganizationSubscriptionSnapshot(
  subscription: Stripe.Subscription
): OrganizationSubscriptionSnapshot {
  const legacyPeriodEnd = (
    subscription as Stripe.Subscription & { current_period_end?: number }
  ).current_period_end
  const currentPeriodEnd =
    subscription.items.data[0]?.current_period_end ?? legacyPeriodEnd
  const customer = subscription.customer

  return {
    status: toStoredStatus(subscription.status),
    metadata: subscription.metadata,
    current_period_end: timestampIso(currentPeriodEnd),
    cancel_at: timestampIso(subscription.cancel_at),
    canceled_at: timestampIso(subscription.canceled_at),
    stripe_customer_id: typeof customer === "string" ? customer : customer.id,
    stripe_subscription_id: subscription.id,
  }
}

async function persistSubscription({
  subscription,
  orgId,
}: {
  subscription: Stripe.Subscription
  orgId: string
}) {
  const admin = createSupabaseAdminClient()
  const snapshot = toOrganizationSubscriptionSnapshot(subscription)
  const { error } = await admin.from("subscriptions").upsert(
    {
      user_id: orgId,
      ...snapshot,
    },
    { onConflict: "user_id,stripe_subscription_id" }
  )

  if (error) {
    throw new Error("The plan changed, but account access is still syncing.")
  }
}

export async function transitionOrganizationPlan({
  state,
  config,
  userId,
  userEmail,
  orgId,
  planTier,
  priceId,
  origin,
  successUrl,
  cancelUrl,
  source,
  attempt,
  checkoutContext,
  checkoutMetadata,
}: {
  state: OrganizationSubscriptionState
  config: StripeRuntimeConfig
  userId: string
  userEmail: string | null
  orgId: string
  planTier: StripeBillingPlanTier
  priceId: string
  origin: string
  successUrl: string
  cancelUrl: string
  source: string
  attempt: string
  checkoutContext?: string | null
  checkoutMetadata?: Record<string, string>
}): Promise<OrganizationPlanTransitionResult> {
  if (state.subscriptions.length > 1) {
    return { kind: "blocked", code: "duplicate_subscriptions" }
  }

  const idempotencyKey = buildPlanTransitionIdempotencyKey({
    orgId,
    planTier,
    attempt,
  })
  const existing = state.subscriptions[0]
  const metadata = subscriptionMetadata({
    subscription: existing,
    userId,
    orgId,
    planTier,
    config,
    extra: checkoutMetadata,
  })

  if (!existing) {
    const checkout = await config.client.checkout.sessions.create(
      {
        mode: "subscription",
        allow_promotion_codes: true,
        client_reference_id: userId,
        customer_email: userEmail ?? undefined,
        line_items: [{ price: priceId, quantity: 1 }],
        metadata: {
          ...metadata,
          source,
          ...(checkoutContext ? { context: checkoutContext } : {}),
        },
        subscription_data: { metadata },
        success_url: new URL(successUrl, origin).toString(),
        cancel_url: new URL(cancelUrl, origin).toString(),
      },
      { idempotencyKey }
    )

    if (!checkout.url) throw new Error("Stripe did not return a checkout URL.")
    return { kind: "checkout", url: checkout.url, sessionId: checkout.id }
  }

  if (existing.cancel_at_period_end || existing.cancel_at) {
    return { kind: "blocked", code: "subscription_canceling" }
  }
  if (!CHANGEABLE_STATUSES.has(existing.status)) {
    return { kind: "blocked", code: "subscription_not_changeable" }
  }
  if (existing.items.data.length !== 1 || !existing.items.data[0]?.id) {
    return { kind: "blocked", code: "subscription_shape_invalid" }
  }

  const item = existing.items.data[0]
  if (item.price.id === priceId) {
    await persistSubscription({ subscription: existing, orgId })
    return { kind: "unchanged", subscription: existing }
  }

  const updated = await config.client.subscriptions.update(
    existing.id,
    {
      items: [
        {
          id: item.id,
          price: priceId,
          quantity: item.quantity ?? 1,
        },
      ],
      metadata,
      proration_behavior: "none",
    },
    { idempotencyKey }
  )
  await persistSubscription({ subscription: updated, orgId })

  return { kind: "updated", subscription: updated }
}
