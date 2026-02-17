import type { SupabaseClient } from "@supabase/supabase-js"
import Stripe from "stripe"

import type { Database } from "@/lib/supabase"
import { supabaseErrorToError } from "@/lib/supabase/errors"
import { getElectiveAddOnModuleSlugs, isElectiveAddOnModuleSlug } from "@/lib/accelerator/elective-modules"
import { env } from "@/lib/env"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

type AccessOptions = {
  supabase: SupabaseClient<Database, "public">
  userId: string
  orgUserId?: string
  isAdmin?: boolean
}

export type LearningEntitlements = {
  hasAcceleratorPurchase: boolean
  hasActiveSubscription: boolean
  hasAcceleratorAccess: boolean
  hasElectiveAccess: boolean
  ownedElectiveModuleSlugs: string[]
}

type SubscriptionStatus = Database["public"]["Enums"]["subscription_status"]

const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null
const ENABLE_STRIPE_ENTITLEMENT_SYNC = process.env.ENABLE_STRIPE_ENTITLEMENT_SYNC === "1"
const stripeSyncAttemptedAt = new Map<string, number>()
const STRIPE_SYNC_COOLDOWN_MS = 2 * 60 * 1000
const SUBSCRIPTION_STATUS_WHITELIST = new Set<SubscriptionStatus>([
  "trialing",
  "active",
  "past_due",
  "canceled",
  "incomplete",
  "incomplete_expired",
])

function isMissingRelationError(error: { code?: string } | null | undefined) {
  const code = error?.code
  return code === "42P01" || code === "42703"
}

function normalizeSubscriptionStatus(status: string | null | undefined): SubscriptionStatus {
  if (status && SUBSCRIPTION_STATUS_WHITELIST.has(status as SubscriptionStatus)) {
    return status as SubscriptionStatus
  }
  return "trialing"
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter((value) => value.length > 0),
    ),
  )
}

async function trySyncSubscriptionFromStripe({
  userId,
  orgUserId,
}: {
  userId: string
  orgUserId: string
}) {
  if (!ENABLE_STRIPE_ENTITLEMENT_SYNC || !stripe || process.env.NODE_ENV === "test") {
    return false
  }

  const lookupKeys = uniqueStrings([orgUserId, userId])
  if (lookupKeys.length === 0) {
    return false
  }

  const cooldownKey = lookupKeys.sort().join(":")
  const now = Date.now()
  const lastAttempt = stripeSyncAttemptedAt.get(cooldownKey)
  if (typeof lastAttempt === "number" && now - lastAttempt < STRIPE_SYNC_COOLDOWN_MS) {
    return false
  }
  stripeSyncAttemptedAt.set(cooldownKey, now)

  const candidates = new Map<string, Stripe.Subscription>()
  for (const lookupKey of lookupKeys) {
    const queries = [
      `metadata['org_user_id']:'${lookupKey}'`,
      `metadata['user_id']:'${lookupKey}'`,
    ]

    for (const query of queries) {
      try {
        const result = await stripe.subscriptions.search({ query, limit: 20 })
        for (const subscription of result.data) {
          candidates.set(subscription.id, subscription)
        }
      } catch {
        // Metadata search can be unavailable in some environments; silently skip.
      }
    }
  }

  if (candidates.size === 0) {
    return false
  }

  const eligible = Array.from(candidates.values()).filter((subscription) => {
    const status = normalizeSubscriptionStatus(subscription.status)
    return status === "active" || status === "trialing"
  })
  if (eligible.length === 0) {
    return false
  }

  eligible.sort((left, right) => right.created - left.created)
  const latest = eligible[0]
  const metadata =
    latest.metadata && Object.keys(latest.metadata).length > 0
      ? latest.metadata
      : null
  const subscriptionOwnerId =
    typeof metadata?.org_user_id === "string" && metadata.org_user_id.trim().length > 0
      ? metadata.org_user_id
      : orgUserId
  const currentPeriodEndUnix = (latest as Stripe.Subscription & { current_period_end?: number }).current_period_end
  const currentPeriodEnd =
    typeof currentPeriodEndUnix === "number"
      ? new Date(currentPeriodEndUnix * 1000).toISOString()
      : null

  const admin = createSupabaseAdminClient()
  const payload: Database["public"]["Tables"]["subscriptions"]["Insert"] = {
    user_id: subscriptionOwnerId,
    stripe_customer_id: typeof latest.customer === "string" ? latest.customer : null,
    stripe_subscription_id: latest.id,
    status: normalizeSubscriptionStatus(latest.status),
    current_period_end: currentPeriodEnd,
    metadata,
  }

  const { error } = await admin
    .from("subscriptions" satisfies keyof Database["public"]["Tables"])
    .upsert(payload, { onConflict: "user_id,stripe_subscription_id" })

  if (error) {
    throw supabaseErrorToError(error, "Unable to sync subscription from Stripe.")
  }

  return true
}

export async function fetchLearningEntitlements({
  supabase,
  userId,
  orgUserId,
  isAdmin = false,
}: AccessOptions): Promise<LearningEntitlements> {
  if (isAdmin) {
    return {
      hasAcceleratorPurchase: true,
      hasActiveSubscription: true,
      hasAcceleratorAccess: true,
      hasElectiveAccess: true,
      ownedElectiveModuleSlugs: getElectiveAddOnModuleSlugs(),
    }
  }

  async function hasActiveOrgSubscription(targetUserId: string): Promise<boolean> {
    const subscriptionsBaseQuery = supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", targetUserId)
      .in("status", ["active", "trialing"])
    const subscriptionsQuery =
      typeof (subscriptionsBaseQuery as { order?: unknown }).order === "function"
        ? (subscriptionsBaseQuery as { order: (column: string, options?: { ascending?: boolean }) => unknown }).order(
            "created_at",
            { ascending: false },
          )
        : subscriptionsBaseQuery

    const result = await (subscriptionsQuery as {
      limit: (count: number) => {
        maybeSingle: <T>() => Promise<{ data: T | null; error: { code?: string; message?: string } | null }>
      }
    })
      .limit(1)
      .maybeSingle<{ id: string }>()

    if (result.error) {
      throw supabaseErrorToError(result.error, "Unable to load subscription entitlements.")
    }

    return Boolean(result.data?.id)
  }

  const [acceleratorResult, electivesResult] = await Promise.all([
    supabase
      .from("accelerator_purchases")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(1)
      .maybeSingle<{ id: string }>(),
    supabase
      .from("elective_purchases")
      .select("module_slug")
      .eq("user_id", userId)
      .eq("status", "active")
      .returns<Array<{ module_slug: string }>>(),
  ])

  if (acceleratorResult.error) {
    throw supabaseErrorToError(acceleratorResult.error, "Unable to load accelerator entitlements.")
  }

  const primarySubscriptionOwnerId = orgUserId ?? userId
  let hasActiveSubscription = await hasActiveOrgSubscription(primarySubscriptionOwnerId)

  // Backwards compatibility: older records were written to the member user_id instead of org owner user_id.
  if (!hasActiveSubscription && orgUserId && orgUserId !== userId) {
    hasActiveSubscription = await hasActiveOrgSubscription(userId)
  }

  if (!hasActiveSubscription) {
    try {
      const synced = await trySyncSubscriptionFromStripe({
        userId,
        orgUserId: primarySubscriptionOwnerId,
      })
      if (synced) {
        hasActiveSubscription = await hasActiveOrgSubscription(primarySubscriptionOwnerId)
        if (!hasActiveSubscription && orgUserId && orgUserId !== userId) {
          hasActiveSubscription = await hasActiveOrgSubscription(userId)
        }
      }
    } catch {
      // Entitlements should still resolve from DB state if Stripe sync fails.
    }
  }

  const hasAcceleratorPurchase = Boolean(acceleratorResult.data?.id)
  const hasAcceleratorAccess = hasAcceleratorPurchase || hasActiveSubscription

  let ownedElectiveModuleSlugs: string[] = []
  if (hasAcceleratorAccess) {
    ownedElectiveModuleSlugs = getElectiveAddOnModuleSlugs()
  } else if (electivesResult.error) {
    if (!isMissingRelationError(electivesResult.error)) {
      throw supabaseErrorToError(electivesResult.error, "Unable to load elective entitlements.")
    }
  } else {
    ownedElectiveModuleSlugs = Array.from(
      new Set(
        (electivesResult.data ?? [])
          .map((row) => row.module_slug.trim().toLowerCase())
          .filter((slug) => isElectiveAddOnModuleSlug(slug)),
      ),
    ).sort()
  }

  return {
    hasAcceleratorPurchase,
    hasActiveSubscription,
    hasAcceleratorAccess,
    hasElectiveAccess: hasAcceleratorAccess || ownedElectiveModuleSlugs.length > 0,
    ownedElectiveModuleSlugs,
  }
}
