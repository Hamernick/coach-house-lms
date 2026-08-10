"use server"

import { randomUUID } from "node:crypto"
import { headers } from "next/headers"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { redirect } from "next/navigation"
import { logger } from "@/lib/logger"
import { requireServerSession } from "@/lib/auth"
import {
  resolveDevtoolsAudience,
  resolveTesterMetadata,
} from "@/lib/devtools/audience"
import {
  resolveStripePriceIdForPlan,
  resolveStripeRuntimeConfigForAudience,
  type StripeBillingPlanTier,
} from "@/lib/billing/stripe-runtime"
import {
  resolveOrganizationSubscriptionState,
  transitionOrganizationPlan,
} from "@/lib/billing/organization-plan-transition"
import { resolveActiveOrganization } from "@/lib/organization/active-org"

function readPlanTier(formData: FormData): StripeBillingPlanTier {
  return formData.get("plan") === "operations_support"
    ? "operations_support"
    : "organization"
}

function readAttempt(formData: FormData) {
  const value = formData.get("attempt")
  return typeof value === "string" && /^[a-zA-Z0-9_-]{1,120}$/.test(value)
    ? value
    : randomUUID()
}

function billingRedirect(params: Record<string, string>): never {
  const search = new URLSearchParams(params)
  redirect(`/billing?${search.toString()}`)
}

function isNextRedirectError(error: unknown) {
  if (isRedirectError(error)) return true
  if (error instanceof Error && error.message.startsWith("redirect:"))
    return true
  if (typeof error === "object" && error && "digest" in error) {
    return String((error as { digest?: unknown }).digest ?? "").startsWith(
      "NEXT_REDIRECT"
    )
  }
  return false
}

export async function startBillingPlanTransition(formData: FormData) {
  const planTier = readPlanTier(formData)
  const attempt = readAttempt(formData)
  const { supabase, session } = await requireServerSession("/billing")
  const user = session.user
  const fallbackIsTester = resolveTesterMetadata(user.user_metadata ?? null)
  const audience = await resolveDevtoolsAudience({
    supabase,
    userId: user.id,
    fallbackIsTester,
  })
  const config = resolveStripeRuntimeConfigForAudience({
    isTester: audience.isTester,
  })
  const priceId = config
    ? resolveStripePriceIdForPlan({ config, planTier })
    : null

  if (!config || !priceId) {
    billingRedirect({ billing_error: "stripe_unavailable", plan: planTier })
  }

  const { orgId } = await resolveActiveOrganization(supabase, user.id)
  const headerStore = await headers()
  const origin = headerStore.get("origin") ?? "https://coachhouse.app"

  try {
    const state = await resolveOrganizationSubscriptionState({
      supabase,
      config,
      orgId,
    })
    const result = await transitionOrganizationPlan({
      state,
      config,
      userId: user.id,
      userEmail: user.email ?? null,
      orgId,
      planTier,
      priceId,
      origin,
      successUrl: `/pricing/success?session_id={CHECKOUT_SESSION_ID}&redirect=${encodeURIComponent("/billing")}`,
      cancelUrl: "/billing?cancelled=true",
      source: "billing",
      attempt,
    })

    if (result.kind === "checkout") {
      redirect(result.url)
    }
    if (result.kind === "blocked") {
      billingRedirect({ billing_error: result.code, plan: planTier })
    }

    billingRedirect({
      plan_change: result.kind === "updated" ? "updated" : "unchanged",
      plan: planTier,
    })
  } catch (error) {
    if (isNextRedirectError(error)) throw error
    logger.error("billing_plan_transition_failed", error, {
      userId: user.id,
      orgId,
      planTier,
    })
    billingRedirect({ billing_error: "transition_failed", plan: planTier })
  }
}

export async function createBillingPortalSession() {
  const { supabase, session } = await requireServerSession("/billing")
  const user = session.user

  const fallbackIsTester = resolveTesterMetadata(user.user_metadata ?? null)
  const audience = await resolveDevtoolsAudience({
    supabase,
    userId: user.id,
    fallbackIsTester,
  })
  const config = resolveStripeRuntimeConfigForAudience({
    isTester: audience.isTester,
  })
  if (!config) return { error: "Billing portal not available yet." }

  let orgId = user.id
  try {
    const resolved = await resolveActiveOrganization(supabase, user.id)
    orgId = resolved.orgId
  } catch {
    orgId = user.id
  }

  let state
  try {
    state = await resolveOrganizationSubscriptionState({
      supabase,
      config,
      orgId,
    })
  } catch (error) {
    logger.error("billing_portal_subscription_verification_failed", error, {
      userId: user.id,
      orgId,
    })
    return {
      error:
        "We couldn't verify your subscription. No billing page was opened.",
    }
  }

  if (state.subscriptions.length > 1) {
    return {
      error:
        "Multiple active subscriptions need support review before billing changes.",
    }
  }

  const subscription = state.subscriptions[0]
  if (!subscription) {
    return { error: "No active Stripe subscription is linked to this account." }
  }

  const customer = subscription.customer
  const customerId = typeof customer === "string" ? customer : customer.id
  const headerStore = await headers()
  const origin = headerStore.get("origin") ?? "https://coachhouse.local"

  try {
    const portalSession = await config.client.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/billing`,
    })

    logger.info("billing_portal_session_created", {
      userId: user.id,
      stripeMode: config.mode,
    })

    return { url: portalSession.url }
  } catch (error) {
    logger.error("billing_portal_session_failed", error, {
      userId: user.id,
    })
    return { error: "We couldn't open the billing portal. Contact support." }
  }
}
