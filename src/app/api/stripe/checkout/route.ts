import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

import { resolveDevtoolsAudience, resolveTesterMetadata } from "@/lib/devtools/audience"
import {
  resolveStripePriceIdForPlan,
  resolveStripeRuntimeConfigForAudience,
  type StripeBillingPlanTier,
} from "@/lib/billing/stripe-runtime"
import { resolveActiveOrganization } from "@/lib/organization/active-org"
import { createSupabaseRouteHandlerClient } from "@/lib/supabase"

type CheckoutErrorCode =
  | "stripe_unavailable"
  | "operations_unavailable"
  | "missing_price"
  | "session_url_missing"
  | "checkout_failed"

function normalizeSource(raw: string | null) {
  const value = (raw ?? "").trim().toLowerCase()
  if (value.length === 0) return "billing"
  if (!/^[a-z0-9_-]{1,80}$/.test(value)) return "billing"
  return value
}

function copySupabaseCookies(from: NextResponse, to: NextResponse) {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie)
  }
}

function buildErrorRedirect({
  request,
  supabaseResponse,
  planTier,
  source,
  code,
}: {
  request: NextRequest
  supabaseResponse: NextResponse
  planTier: StripeBillingPlanTier
  source: string
  code: CheckoutErrorCode
}) {
  const params = new URLSearchParams()
  params.set("paywall", "organization")
  params.set("plan", planTier)
  params.set("checkout_error", code)
  params.set("source", source)

  const response = NextResponse.redirect(new URL(`/organization?${params.toString()}`, request.url))
  copySupabaseCookies(supabaseResponse, response)
  return response
}

function buildLoginRedirect({
  request,
  supabaseResponse,
  source,
  planTier,
}: {
  request: NextRequest
  supabaseResponse: NextResponse
  source: string
  planTier: StripeBillingPlanTier
}) {
  const nextPath = `/api/stripe/checkout?plan=${encodeURIComponent(planTier)}&source=${encodeURIComponent(source)}`
  const response = NextResponse.redirect(
    new URL(`/?section=login&source=${encodeURIComponent(source)}&redirect=${encodeURIComponent(nextPath)}`, request.url),
  )
  copySupabaseCookies(supabaseResponse, response)
  return response
}

export async function GET(request: NextRequest) {
  const supabaseResponse = NextResponse.next()
  const supabase = createSupabaseRouteHandlerClient(request, supabaseResponse)

  const planParam = request.nextUrl.searchParams.get("plan")
  const planTier: StripeBillingPlanTier = planParam === "operations_support" ? "operations_support" : "organization"
  const planName = planTier === "operations_support" ? "Operations Support" : "Organization"
  const source = normalizeSource(request.nextUrl.searchParams.get("source"))

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return buildLoginRedirect({ request, supabaseResponse, source, planTier })
  }

  const fallbackIsTester = resolveTesterMetadata(user.user_metadata ?? null)
  const audience = await resolveDevtoolsAudience({
    supabase,
    userId: user.id,
    fallbackIsTester,
  })

  const stripeConfig = resolveStripeRuntimeConfigForAudience({ isTester: audience.isTester })
  if (!stripeConfig) {
    return buildErrorRedirect({
      request,
      supabaseResponse,
      planTier,
      source,
      code: "stripe_unavailable",
    })
  }

  const priceId = resolveStripePriceIdForPlan({ config: stripeConfig, planTier })
  if (!priceId) {
    return buildErrorRedirect({
      request,
      supabaseResponse,
      planTier,
      source,
      code: planTier === "operations_support" ? "operations_unavailable" : "missing_price",
    })
  }

  const userId = user.id
  let orgId = userId
  try {
    const resolved = await resolveActiveOrganization(supabase, userId)
    orgId = resolved.orgId
  } catch {
    orgId = userId
  }

  try {
    const checkout = await stripeConfig.client.checkout.sessions.create({
      mode: "subscription",
      allow_promotion_codes: true,
      client_reference_id: userId,
      customer_email: user.email ?? undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        kind: "organization",
        user_id: userId,
        org_user_id: orgId,
        planName,
        plan_tier: planTier,
        stripe_mode: stripeConfig.mode,
      },
      subscription_data: {
        metadata: {
          kind: "organization",
          user_id: userId,
          org_user_id: orgId,
          planName,
          plan_tier: planTier,
          stripe_mode: stripeConfig.mode,
        },
      },
      success_url: `${request.nextUrl.origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/pricing?cancelled=true`,
    })

    if (!checkout.url) {
      return buildErrorRedirect({
        request,
        supabaseResponse,
        planTier,
        source,
        code: "session_url_missing",
      })
    }

    const response = NextResponse.redirect(checkout.url)
    copySupabaseCookies(supabaseResponse, response)
    return response
  } catch (error) {
    const stripeError = error as Stripe.errors.StripeError | null
    console.error("Unable to start Stripe checkout (route)", {
      message: error instanceof Error ? error.message : "unknown_error",
      planTier,
      source,
      userId,
      orgId,
      stripeMode: stripeConfig.mode,
      stripeType: stripeError?.type ?? null,
      stripeCode: stripeError?.code ?? null,
      stripeParam: stripeError?.param ?? null,
    })

    return buildErrorRedirect({
      request,
      supabaseResponse,
      planTier,
      source,
      code: "checkout_failed",
    })
  }
}

