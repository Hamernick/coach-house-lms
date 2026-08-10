import type { SupabaseClient } from "@supabase/supabase-js"

import {
  resolveOrganizationSubscriptionState,
  toOrganizationSubscriptionSnapshot,
  type OrganizationSubscriptionSnapshot,
} from "@/lib/billing/organization-plan-transition"
import type { StripeRuntimeConfig } from "@/lib/billing/stripe-runtime"
import type { Json } from "@/lib/supabase"
import type { Database } from "@/lib/supabase/types"

export type BillingPageNotice = {
  title: string
  description: string
  destructive: boolean
}

type LocalBillingSubscription = {
  status: string | null
  metadata: Json | null
  current_period_end: string | null
  cancel_at: string | null
  canceled_at: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
}

export type BillingPageSubscription =
  | LocalBillingSubscription
  | OrganizationSubscriptionSnapshot
  | null

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export function resolveBillingNotice(
  params: Record<string, string | string[] | undefined>
): BillingPageNotice | null {
  const planChange = firstParam(params.plan_change)
  const error = firstParam(params.billing_error)
  const requestedPlan = firstParam(params.requested_plan)

  if (planChange === "updated") {
    return {
      title: "Plan updated",
      description:
        "Your plan access changed now. The new monthly price begins at your next renewal; no proration charge was created.",
      destructive: false,
    }
  }
  if (planChange === "unchanged") {
    return {
      title: "Plan already current",
      description: "No subscription or billing change was needed.",
      destructive: false,
    }
  }
  if (firstParam(params.cancelled) === "true") {
    return {
      title: "Checkout canceled",
      description: "No subscription change was made.",
      destructive: false,
    }
  }
  if (
    requestedPlan === "organization" ||
    requestedPlan === "operations_support"
  ) {
    return {
      title: "Manage your existing subscription here",
      description:
        "Choose the plan below to update your current subscription. Coach House will not open a second checkout.",
      destructive: false,
    }
  }
  if (!error) return null

  const descriptions: Record<string, string> = {
    duplicate_subscriptions:
      "We found multiple active subscriptions. No change was made. Open Manage billing and contact support before choosing another plan.",
    subscription_canceling:
      "This subscription is scheduled to cancel. Open Manage billing to resume it before changing plans.",
    subscription_not_changeable:
      "This subscription needs billing attention before its plan can change. Open Manage billing to continue.",
    subscription_shape_invalid:
      "This subscription has an unexpected billing setup. No change was made; contact support.",
    stripe_unavailable:
      "Billing is temporarily unavailable. No change was made; try again shortly.",
    transition_failed:
      "We could not verify the complete plan change. No second subscription was created. Try again or contact support.",
  }

  return {
    title: "Plan change not completed",
    description: descriptions[error] ?? descriptions.transition_failed,
    destructive: true,
  }
}

export async function loadBillingPageSubscription({
  supabase,
  stripeConfig,
  orgId,
}: {
  supabase: SupabaseClient<Database, "public">
  stripeConfig: StripeRuntimeConfig | null
  orgId: string
}): Promise<{
  subscription: BillingPageSubscription
  billingStateNotice: BillingPageNotice | null
}> {
  const { data: localSubscription, error: localError } = await supabase
    .from("subscriptions")
    .select(
      "status, metadata, current_period_end, cancel_at, canceled_at, stripe_customer_id, stripe_subscription_id"
    )
    .eq("user_id", orgId)
    .in("status", ["active", "trialing", "past_due", "incomplete"])
    .not("stripe_subscription_id", "ilike", "stub_%")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<LocalBillingSubscription>()

  if (!stripeConfig) {
    return {
      subscription: localSubscription,
      billingStateNotice: localError
        ? {
            title: "Billing status unavailable",
            description:
              "We could not load your saved billing status. No plan change is available right now.",
            destructive: false,
          }
        : null,
    }
  }

  try {
    const liveState = await resolveOrganizationSubscriptionState({
      supabase,
      config: stripeConfig,
      orgId,
    })
    const subscription = liveState.subscriptions[0]
      ? toOrganizationSubscriptionSnapshot(liveState.subscriptions[0])
      : null

    return {
      subscription,
      billingStateNotice:
        liveState.subscriptions.length > 1
          ? {
              title: "Billing support needed",
              description:
                "We found multiple active subscriptions. Plan changes are blocked to prevent another charge. Contact support for review.",
              destructive: true,
            }
          : null,
    }
  } catch {
    return {
      subscription: localSubscription,
      billingStateNotice: {
        title: "Live billing status unavailable",
        description:
          "We are showing the last saved account status. Plan changes will remain blocked unless Stripe verification succeeds.",
        destructive: false,
      },
    }
  }
}
