"use server"

import { randomUUID } from "node:crypto"
import { headers } from "next/headers"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { redirect } from "next/navigation"

import { requireServerSession } from "@/lib/auth"
import {
  resolveOrganizationSubscriptionState,
  transitionOrganizationPlan,
} from "@/lib/billing/organization-plan-transition"
import {
  resolveStripePriceIdForPlan,
  resolveStripeRuntimeConfigForAudience,
  type StripeBillingPlanTier,
} from "@/lib/billing/stripe-runtime"
import {
  resolveDevtoolsAudience,
  resolveTesterMetadata,
} from "@/lib/devtools/audience"
import { resolveActiveOrganization } from "@/lib/organization/active-org"

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

function readPlanTier(formData: FormData): StripeBillingPlanTier {
  const explicit = formData.get("planTier")
  if (explicit === "operations_support") return "operations_support"
  if (explicit === "organization") return "organization"

  const planName = formData.get("planName")
  return typeof planName === "string" &&
    planName.toLowerCase().includes("operations")
    ? "operations_support"
    : "organization"
}

function readSource(formData: FormData) {
  const value = formData.get("source")
  return typeof value === "string" && /^[a-zA-Z0-9_-]{1,80}$/.test(value)
    ? value
    : "billing"
}

function redirectCheckoutError({
  planTier,
  source,
  code,
}: {
  planTier: StripeBillingPlanTier
  source: string
  code: "stripe_unavailable" | "missing_price" | "checkout_failed"
}): never {
  const params = new URLSearchParams({
    paywall: "organization",
    plan: planTier,
    checkout_error: code,
    source,
  })
  redirect(`/organization?${params.toString()}`)
}

export async function startCheckout(formData: FormData) {
  const checkoutModeEntry = formData.get("checkoutMode")
  const checkoutMode =
    typeof checkoutModeEntry === "string"
      ? checkoutModeEntry.trim().toLowerCase()
      : "organization"
  if (
    checkoutMode !== "organization" &&
    checkoutMode !== "accelerator" &&
    checkoutMode !== "elective"
  ) {
    redirectCheckoutError({
      planTier: "organization",
      source: readSource(formData),
      code: "checkout_failed",
    })
  }

  const planTier = readPlanTier(formData)
  const source = readSource(formData)
  const { supabase, session } = await requireServerSession("/pricing")
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
  if (!config) {
    redirectCheckoutError({ planTier, source, code: "stripe_unavailable" })
  }

  const priceId = resolveStripePriceIdForPlan({ config, planTier })
  if (!priceId) {
    redirectCheckoutError({ planTier, source, code: "missing_price" })
  }

  const { orgId } = await resolveActiveOrganization(supabase, user.id).catch(
    () => ({ orgId: user.id })
  )
  const headerStore = await headers()
  const origin =
    headerStore.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"

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
      successUrl: "/pricing/success?session_id={CHECKOUT_SESSION_ID}",
      cancelUrl: "/pricing?cancelled=true",
      source,
      attempt: randomUUID(),
    })

    if (result.kind === "checkout") redirect(result.url)
    if (result.kind === "blocked") {
      redirect(`/billing?billing_error=${result.code}&plan=${planTier}`)
    }
    redirect(
      `/billing?plan_change=${result.kind === "updated" ? "updated" : "unchanged"}&plan=${planTier}`
    )
  } catch (error) {
    if (isNextRedirectError(error)) throw error
    console.error("Unable to start safe Stripe plan transition", {
      message: error instanceof Error ? error.message : "unknown_error",
      userId: user.id,
      orgId,
      planTier,
      source,
      stripeMode: config.mode,
    })
    redirectCheckoutError({ planTier, source, code: "checkout_failed" })
  }
}
