import { isRedirectError } from "next/dist/client/components/redirect-error"
import { redirect } from "next/navigation"
import Stripe from "stripe"

import { requireServerSession } from "@/lib/auth"
import { resolvePaidPlanTierFromMetadata } from "@/lib/billing/plan-tier"
import { resolveDevtoolsAudience, resolveTesterMetadata } from "@/lib/devtools/audience"
import { resolveStripeRuntimeConfigsForFallback } from "@/lib/billing/stripe-runtime"
import { createSupabaseAdminClient } from "@/lib/supabase"
import { isElectiveAddOnModuleSlug } from "@/lib/accelerator/elective-modules"
import { maybeStartOrganizationTrialFromAccelerator } from "./_lib/success-helpers"
import {
  appendInternalRedirectParams,
  appendSuccessfulPricingReturn,
  canTreatCheckoutAsSuccessfulSubscriptionReturn,
  getSafeRedirect,
  resolveCheckoutSubscription,
  resolveSuccessfulCheckoutPlanTier,
} from "./_lib/onboarding-return"
import type { Database } from "@/lib/supabase"

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function isNextRedirectError(error: unknown) {
  if (isRedirectError(error)) return true
  if (error instanceof Error && error.message.startsWith("redirect:")) return true
  if (typeof error === "object" && error && "digest" in error) {
    const digest = String((error as { digest?: unknown }).digest ?? "")
    if (digest.startsWith("NEXT_REDIRECT")) return true
  }
  return false
}

export default async function PricingSuccessPage({
  searchParams,
}: {
  searchParams?: SearchParams
}) {
  const params = searchParams ? await searchParams : {}
  const sessionId = typeof params?.session_id === "string" ? params.session_id : undefined
  const redirectTarget = getSafeRedirect(params?.redirect)

  const { supabase, session } = await requireServerSession("/pricing/success")
  const user = session.user
  const userId = user.id

  const fallbackIsTester = resolveTesterMetadata(user.user_metadata ?? null)
  const audience = await resolveDevtoolsAudience({
    supabase,
    userId,
    fallbackIsTester,
  })
  const stripeConfigs = resolveStripeRuntimeConfigsForFallback({ preferTester: audience.isTester })
  if (stripeConfigs.length === 0) {
    redirect("/organization?paywall=organization&plan=organization&checkout_error=stripe_unavailable&source=billing")
  }

  if (sessionId) {
    try {
      let checkout: Stripe.Checkout.Session | null = null
      let checkoutStripeConfig = stripeConfigs[0]
      for (const config of stripeConfigs) {
        try {
          checkout = await config.client.checkout.sessions.retrieve(sessionId, {
            expand: ["subscription"],
          })
          checkoutStripeConfig = config
          break
        } catch {
          checkout = null
        }
      }
      if (!checkout) {
        throw new Error("checkout_session_not_found_in_available_stripe_modes")
      }

      const checkoutUserId = checkout.client_reference_id ?? checkout.metadata?.user_id ?? null
      if (!checkoutUserId || checkoutUserId !== userId) {
        redirect("/pricing?cancelled=true")
      }

      const shouldShowWelcome = checkout.metadata?.context === "onboarding"
      const welcomeQuery = shouldShowWelcome ? "&welcome=1" : ""

      if (checkout.mode === "payment" && checkout.metadata?.kind === "accelerator") {
        const admin = createSupabaseAdminClient()
        const variant =
          checkout.metadata?.accelerator_variant === "without_coaching"
            ? "without_coaching"
            : "with_coaching"
        const coachingIncluded =
          checkout.metadata?.coaching_included != null
            ? checkout.metadata.coaching_included === "true"
            : variant === "with_coaching"
        const payload: Database["public"]["Tables"]["accelerator_purchases"]["Insert"] = {
          user_id: userId,
          stripe_checkout_session_id: checkout.id,
          stripe_payment_intent_id: typeof checkout.payment_intent === "string" ? checkout.payment_intent : null,
          stripe_customer_id: typeof checkout.customer === "string" ? checkout.customer : null,
          coaching_included: coachingIncluded,
          status: "active",
        }

        await admin
          .from("accelerator_purchases" satisfies keyof Database["public"]["Tables"])
          .upsert(payload, { onConflict: "stripe_checkout_session_id" })

        const customerId = typeof checkout.customer === "string" ? checkout.customer : null
        if (customerId) {
          await maybeStartOrganizationTrialFromAccelerator({
            stripeClient: checkoutStripeConfig.client,
            organizationPriceId: checkoutStripeConfig.organizationPriceId,
            admin,
            userId,
            checkoutSessionId: checkout.id,
            customerId,
          })
        }

        redirect(`/organization?purchase=accelerator${welcomeQuery}`)
      }

      if (checkout.mode === "payment" && checkout.metadata?.kind === "elective") {
        const admin = createSupabaseAdminClient()
        const moduleSlugCandidate = checkout.metadata?.elective_module_slug ?? ""
        if (!isElectiveAddOnModuleSlug(moduleSlugCandidate)) {
          redirect("/pricing?plan=electives&cancelled=true")
        }

        const payload: Database["public"]["Tables"]["elective_purchases"]["Insert"] = {
          user_id: userId,
          module_slug: moduleSlugCandidate,
          stripe_checkout_session_id: checkout.id,
          stripe_payment_intent_id: typeof checkout.payment_intent === "string" ? checkout.payment_intent : null,
          stripe_customer_id: typeof checkout.customer === "string" ? checkout.customer : null,
          status: "active",
        }

        await admin
          .from("elective_purchases" satisfies keyof Database["public"]["Tables"])
          .upsert(payload, { onConflict: "user_id,module_slug" })

        redirect(`/organization?purchase=elective&elective=${encodeURIComponent(moduleSlugCandidate)}${welcomeQuery}`)
      }

      if (checkout.mode === "subscription") {
        const subscription = await resolveCheckoutSubscription({
          checkout,
          stripeClient: checkoutStripeConfig.client,
        })
        if (subscription) {
          type SubscriptionStatus = Database["public"]["Enums"]["subscription_status"]

          const allowed: SubscriptionStatus[] = [
            "trialing",
            "active",
            "past_due",
            "canceled",
            "incomplete",
            "incomplete_expired",
          ]
          const status = allowed.includes(subscription.status as SubscriptionStatus)
            ? (subscription.status as SubscriptionStatus)
            : "trialing"

          const currentPeriodEndUnix =
            (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end ?? null
          const currentPeriodEnd = currentPeriodEndUnix ? new Date(currentPeriodEndUnix * 1000).toISOString() : null

          const metadataSource =
            subscription.metadata && Object.keys(subscription.metadata).length > 0
              ? subscription.metadata
              : checkout.metadata ?? null
          const metadataWithMode: Record<string, string> | null = metadataSource
            ? {
                ...(metadataSource as Record<string, string>),
                stripe_mode:
                  typeof (metadataSource as Record<string, string>).stripe_mode === "string"
                    ? (metadataSource as Record<string, string>).stripe_mode
                    : checkoutStripeConfig.mode,
              }
            : null
          const subscriptionOwnerId =
            typeof metadataWithMode?.org_user_id === "string" && metadataWithMode.org_user_id.length > 0
              ? metadataWithMode.org_user_id
              : userId
          const resolvedPlanTier =
            resolvePaidPlanTierFromMetadata(metadataWithMode) ?? "organization"
          const planName =
            typeof metadataWithMode?.planName === "string" ? metadataWithMode.planName : null
          const kind = typeof metadataWithMode?.kind === "string" ? metadataWithMode.kind : null

          const upsertPayload: Database["public"]["Tables"]["subscriptions"]["Insert"] = {
            user_id: subscriptionOwnerId,
            stripe_customer_id: typeof subscription.customer === "string" ? subscription.customer : null,
            stripe_subscription_id: subscription.id,
            status,
            current_period_end: currentPeriodEnd,
            metadata:
              metadataWithMode && Object.keys(metadataWithMode).length > 0
                ? metadataWithMode
                : planName
                  ? { planName, stripe_mode: checkoutStripeConfig.mode }
                  : null,
          }

          try {
            const admin = createSupabaseAdminClient()
            await admin
              .from("subscriptions" satisfies keyof Database["public"]["Tables"])
              .upsert(upsertPayload, { onConflict: "user_id,stripe_subscription_id" })
          } catch (error) {
            console.error("Unable to persist subscription after checkout", {
              sessionId: checkout.id,
              subscriptionId: subscription.id,
              subscriptionOwnerId,
              redirectTarget,
              error,
            })
          }

          const isSuccessfulSubscriptionState =
            status === "trialing" || status === "active" || status === "past_due"

          if (kind === "accelerator") {
            redirect(`/organization?purchase=accelerator${welcomeQuery}`)
          }

          if (redirectTarget) {
            if (isSuccessfulSubscriptionState) {
              redirect(appendSuccessfulPricingReturn(redirectTarget, resolvedPlanTier))
            }
            redirect(
              appendInternalRedirectParams(redirectTarget, {
                checkout_error: "checkout_failed",
                subscription: status,
              }),
            )
          }

          if (isSuccessfulSubscriptionState) {
            redirect(`/organization?subscription=${status}${welcomeQuery}`)
          }
          redirect(`/organization?checkout_error=checkout_failed&subscription=${status}`)
        }

        if (redirectTarget && canTreatCheckoutAsSuccessfulSubscriptionReturn(checkout)) {
          redirect(
            appendSuccessfulPricingReturn(
              redirectTarget,
              resolveSuccessfulCheckoutPlanTier(checkout),
            ),
          )
        }
      }
    } catch (error) {
      if (isNextRedirectError(error)) {
        throw error
      }
      console.warn("Unable to read Stripe checkout session", error)
    }
  }

  if (redirectTarget) {
    redirect(redirectTarget)
  }

  redirect("/organization?checkout=success")
}
