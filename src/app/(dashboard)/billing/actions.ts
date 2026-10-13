"use server"

import { headers } from "next/headers"
import { logger } from "@/lib/logger"
import { requireServerSession } from "@/lib/auth"
import { resolveDevtoolsAudience, resolveTesterMetadata } from "@/lib/devtools/audience"
import { resolveStripeRuntimeConfigsForFallback } from "@/lib/billing/stripe-runtime"
import { resolveActiveOrganization } from "@/lib/organization/active-org"

export async function createBillingPortalSession() {
  const { supabase, session } = await requireServerSession("/billing")
  const user = session.user

  const fallbackIsTester = resolveTesterMetadata(user.user_metadata ?? null)
  const audience = await resolveDevtoolsAudience({
    supabase,
    userId: user.id,
    fallbackIsTester,
  })
  const stripeConfigs = resolveStripeRuntimeConfigsForFallback({
    preferTester: audience.isTester,
  })
  if (stripeConfigs.length === 0) return { error: "Billing portal not available yet." }

  let orgId = user.id
  try {
    const resolved = await resolveActiveOrganization(supabase, user.id)
    orgId = resolved.orgId
  } catch {
    orgId = user.id
  }

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id, metadata")
    .eq("user_id", orgId)
    .not("stripe_subscription_id", "ilike", "stub_%")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ stripe_customer_id: string | null; metadata: Record<string, string> | null }>()

  if (error) {
    logger.error("billing_portal_subscription_lookup_failed", error, { userId: user.id })
    return { error: "Unable to locate your subscription." }
  }

  const customerId = subscription?.stripe_customer_id
  if (!customerId) {
    return { error: "No Stripe customer linked to this account yet." }
  }

  const headerStore = await headers()
  const origin = headerStore.get("origin") ?? "https://coachhouse.local"

  const modeHint = typeof subscription?.metadata?.stripe_mode === "string"
    ? subscription.metadata.stripe_mode
    : null
  const orderedConfigs = modeHint
    ? [
        ...stripeConfigs.filter((config) => config.mode === modeHint),
        ...stripeConfigs.filter((config) => config.mode !== modeHint),
      ]
    : stripeConfigs

  let lastPortalError: unknown = null
  for (const config of orderedConfigs) {
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
    } catch (portalError) {
      lastPortalError = portalError
    }
  }

  logger.error("billing_portal_session_failed", lastPortalError, { userId: user.id })
  return { error: "We couldn't open the billing portal. Contact support." }
}
