import { redirect } from "next/navigation"
import Stripe from "stripe"

import { env } from "@/lib/env"
import { requireServerSession } from "@/lib/auth"
import { createSupabaseAdminClient } from "@/lib/supabase"
import { isElectiveAddOnModuleSlug } from "@/lib/accelerator/elective-modules"
import type { Database } from "@/lib/supabase"

type SearchParams = Promise<Record<string, string | string[] | undefined>>

const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null

async function maybeStartOrganizationTrialFromAccelerator({
  stripeClient,
  admin,
  userId,
  checkoutSessionId,
  customerId,
}: {
  stripeClient: Stripe
  admin: ReturnType<typeof createSupabaseAdminClient>
  userId: string
  checkoutSessionId: string
  customerId: string
}) {
  const organizationPriceId = env.STRIPE_ORGANIZATION_PRICE_ID
  if (!organizationPriceId) return

  const { data: existing } = await admin
    .from("subscriptions" satisfies keyof Database["public"]["Tables"])
    .select("id, status")
    .eq("user_id", userId)
    .in("status", ["active", "trialing"])
    .limit(1)
    .maybeSingle<{ id: string; status: string }>()

  if (existing) return

  const subscription = await stripeClient.subscriptions.create(
    {
      customer: customerId,
      items: [{ price: organizationPriceId }],
      trial_period_days: 30,
      metadata: {
        user_id: userId,
        planName: "Organization",
        context: "accelerator_bundle",
      },
    },
    { idempotencyKey: `accelerator_bundle_${checkoutSessionId}` },
  )

  const currentPeriodEndUnix =
    (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end ?? null
  const currentPeriodEnd = currentPeriodEndUnix ? new Date(currentPeriodEndUnix * 1000).toISOString() : null

  const allowed: Database["public"]["Enums"]["subscription_status"][] = [
    "trialing",
    "active",
    "past_due",
    "canceled",
    "incomplete",
    "incomplete_expired",
  ]
  const status = allowed.includes(subscription.status as Database["public"]["Enums"]["subscription_status"])
    ? (subscription.status as Database["public"]["Enums"]["subscription_status"])
    : "trialing"

  const upsertPayload: Database["public"]["Tables"]["subscriptions"]["Insert"] = {
    user_id: userId,
    stripe_customer_id: typeof subscription.customer === "string" ? subscription.customer : customerId,
    stripe_subscription_id: subscription.id,
    status,
    current_period_end: currentPeriodEnd,
    metadata: { planName: "Organization", context: "accelerator_bundle" },
  }

  await admin
    .from("subscriptions" satisfies keyof Database["public"]["Tables"])
    .upsert(upsertPayload, { onConflict: "user_id,stripe_subscription_id" })
}

export default async function PricingSuccessPage({
  searchParams,
}: {
  searchParams?: SearchParams
}) {
  const params = searchParams ? await searchParams : {}
  const sessionId = typeof params?.session_id === "string" ? params.session_id : undefined

  const { session } = await requireServerSession("/pricing/success")
  const user = session.user
  const userId = user.id

  if (!stripe) {
    redirect("/organization?paywall=organization&plan=organization&checkout_error=stripe_unavailable&source=billing")
  }

  if (stripe && sessionId) {
    try {
      const checkout = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["subscription"],
      })

      const checkoutUserId = checkout.client_reference_id ?? checkout.metadata?.user_id ?? null
      if (!checkoutUserId || checkoutUserId !== userId) {
        redirect("/pricing?cancelled=true")
      }

      const shouldShowWelcome = checkout.metadata?.context === "onboarding"
      const welcomeQuery = shouldShowWelcome ? "&welcome=1" : ""

      const admin = createSupabaseAdminClient()

      if (checkout.mode === "payment" && checkout.metadata?.kind === "accelerator") {
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
            stripeClient: stripe,
            admin,
            userId,
            checkoutSessionId: checkout.id,
            customerId,
          })
        }

        redirect(`/organization?purchase=accelerator${welcomeQuery}`)
      }

      if (checkout.mode === "payment" && checkout.metadata?.kind === "elective") {
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
        const subscription = checkout.subscription as Stripe.Subscription | null
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
          const subscriptionOwnerId =
            typeof metadataSource?.org_user_id === "string" && metadataSource.org_user_id.length > 0
              ? metadataSource.org_user_id
              : userId
          const planName =
            typeof metadataSource?.planName === "string" ? metadataSource.planName : null
          const kind = typeof metadataSource?.kind === "string" ? metadataSource.kind : null

          const upsertPayload: Database["public"]["Tables"]["subscriptions"]["Insert"] = {
            user_id: subscriptionOwnerId,
            stripe_customer_id: typeof subscription.customer === "string" ? subscription.customer : null,
            stripe_subscription_id: subscription.id,
            status,
            current_period_end: currentPeriodEnd,
            metadata: metadataSource && Object.keys(metadataSource).length > 0 ? metadataSource : planName ? { planName } : null,
          }

          await admin
            .from("subscriptions" satisfies keyof Database["public"]["Tables"])
            .upsert(upsertPayload, { onConflict: "user_id,stripe_subscription_id" })

          if (kind === "accelerator") {
            redirect(`/organization?purchase=accelerator${welcomeQuery}`)
          }

          redirect(`/organization?subscription=${status}${welcomeQuery}`)
        }
      }
    } catch (error) {
      console.warn("Unable to read Stripe checkout session", error)
    }
  }

  redirect("/organization?checkout=success")
}
