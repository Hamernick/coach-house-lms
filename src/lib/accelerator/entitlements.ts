import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase"
import { supabaseErrorToError } from "@/lib/supabase/errors"
import { getElectiveAddOnModuleSlugs, isElectiveAddOnModuleSlug } from "@/lib/accelerator/elective-modules"

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

function isMissingRelationError(error: { code?: string } | null | undefined) {
  const code = error?.code
  return code === "42P01" || code === "42703"
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

  // Some test doubles do not implement `order`; fall back gracefully.
  const subscriptionsBaseQuery = supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", orgUserId ?? userId)
  const subscriptionsQuery =
    typeof (subscriptionsBaseQuery as { order?: unknown }).order === "function"
      ? (subscriptionsBaseQuery as { order: (column: string, options?: { ascending?: boolean }) => unknown }).order(
          "created_at",
          { ascending: false },
        )
      : subscriptionsBaseQuery

  const [acceleratorResult, subscriptionResult, electivesResult] = await Promise.all([
    supabase
      .from("accelerator_purchases")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(1)
      .maybeSingle<{ id: string }>(),
    (subscriptionsQuery as {
      limit: (count: number) => {
        maybeSingle: <T>() => Promise<{ data: T | null; error: { code?: string; message?: string } | null }>
      }
    })
      .limit(1)
      .maybeSingle<{ status: string | null }>(),
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

  if (subscriptionResult.error) {
    throw supabaseErrorToError(subscriptionResult.error, "Unable to load subscription entitlements.")
  }

  const hasAcceleratorPurchase = Boolean(acceleratorResult.data?.id)
  const hasActiveSubscription =
    subscriptionResult.data?.status === "active" || subscriptionResult.data?.status === "trialing"
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
