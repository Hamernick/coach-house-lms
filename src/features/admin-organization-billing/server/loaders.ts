import "server-only"

import { logger } from "@/lib/logger"
import { requireAdmin } from "@/lib/admin/auth"

import { resolveAdminOrganizationBillingPlan } from "../lib"
import type { AdminOrganizationBillingState } from "../types"
import {
  loadLatestAdminOrganizationBillingPayment,
  MissingLinkedStripeSubscriptionError,
  resolveAdminOrganizationBillingContext,
  subscriptionCurrentPeriodEnd,
} from "./context"

export async function loadAdminOrganizationBilling(
  orgId: string
): Promise<AdminOrganizationBillingState> {
  try {
    const { supabase } = await requireAdmin()
    const context = await resolveAdminOrganizationBillingContext({
      orgId,
      supabase,
    })
    if (!context) return { mode: "none", orgId }

    const latestPayment = await loadLatestAdminOrganizationBillingPayment({
      context,
    })
    const item = context.subscription.items.data[0] ?? null
    const priceId = item?.price?.id ?? null
    const currency = item?.price?.currency ?? "usd"
    const customer = context.subscription.customer
    const customerId = typeof customer === "string" ? customer : customer.id

    return {
      mode: "ready",
      summary: {
        cancelAtPeriodEnd: context.subscription.cancel_at_period_end,
        currency,
        currentPeriodEnd: subscriptionCurrentPeriodEnd(context.subscription),
        dashboardUrl:
          context.config.mode === "test"
            ? `https://dashboard.stripe.com/test/customers/${customerId}`
            : `https://dashboard.stripe.com/customers/${customerId}`,
        latestPayment: latestPayment
          ? {
              amountCents: latestPayment.charge.amount,
              createdAt: new Date(
                latestPayment.charge.created * 1000
              ).toISOString(),
              currency: latestPayment.charge.currency,
              refundedAmountCents: latestPayment.charge.amount_refunded,
              refundableAmountCents: Math.max(
                0,
                latestPayment.charge.amount -
                  latestPayment.charge.amount_refunded
              ),
              status: latestPayment.charge.refunded
                ? "refunded"
                : latestPayment.charge.status,
            }
          : null,
        orgId,
        plan: resolveAdminOrganizationBillingPlan({
          metadataPlan: context.subscription.metadata.plan_tier,
          operationsSupportPriceId: context.config.operationsSupportPriceId,
          organizationPriceId: context.config.organizationPriceId,
          priceId,
        }),
        priceAmountCents: item?.price?.unit_amount ?? null,
        status: context.subscription.status,
      },
    }
  } catch (error) {
    if (error instanceof MissingLinkedStripeSubscriptionError) {
      logger.warn("admin_organization_billing_link_unavailable", { orgId })
      return {
        mode: "unavailable",
        message:
          "The linked Stripe subscription was not found. Open Stripe to reconnect this account.",
        orgId,
      }
    }

    logger.error("admin_organization_billing_load_failed", error, { orgId })
    return {
      mode: "unavailable",
      message:
        "Billing data is unavailable. Open Stripe to manage this account.",
      orgId,
    }
  }
}
