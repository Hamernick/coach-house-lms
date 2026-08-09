"use server"

import { revalidatePath } from "next/cache"

import { requireAdmin } from "@/lib/admin/auth"
import { logger } from "@/lib/logger"

import {
  ADMIN_ORGANIZATION_BILLING_PLAN_LABELS,
  isAdminOrganizationBillingPlan,
} from "../lib"
import type {
  AdminOrganizationBillingActionResult,
  AdminOrganizationBillingPlan,
} from "../types"
import {
  loadLatestAdminOrganizationBillingPayment,
  persistAdminOrganizationSubscriptionSnapshot,
  resolveAdminOrganizationBillingContext,
} from "./context"

const CHANGEABLE_SUBSCRIPTION_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
])

function targetPriceId({
  context,
  plan,
}: {
  context: Awaited<ReturnType<typeof resolveAdminOrganizationBillingContext>>
  plan: AdminOrganizationBillingPlan
}) {
  if (!context) return null
  return plan === "organization"
    ? context.config.organizationPriceId
    : context.config.operationsSupportPriceId
}

export async function changeAdminOrganizationBillingPlanAction({
  orgId,
  plan,
}: {
  orgId: string
  plan: AdminOrganizationBillingPlan
}): Promise<AdminOrganizationBillingActionResult> {
  if (!orgId || !isAdminOrganizationBillingPlan(plan)) {
    return { error: "Choose a valid organization billing plan." }
  }

  try {
    const { supabase, userId } = await requireAdmin()
    const context = await resolveAdminOrganizationBillingContext({
      orgId,
      supabase,
    })
    if (!context)
      return { error: "This organization has no paid subscription." }
    if (!CHANGEABLE_SUBSCRIPTION_STATUSES.has(context.subscription.status)) {
      return {
        error: `This ${context.subscription.status} subscription cannot change plans.`,
      }
    }

    const priceId = targetPriceId({ context, plan })
    if (!priceId) return { error: "The selected Stripe price is unavailable." }
    if (context.subscription.items.data.length !== 1) {
      return {
        error:
          "This subscription has multiple billing items. Manage it in Stripe.",
      }
    }

    const item = context.subscription.items.data[0]
    if (item.price.id === priceId) return { ok: true }

    const updated = await context.config.client.subscriptions.update(
      context.subscription.id,
      {
        items: [{ id: item.id, price: priceId, quantity: item.quantity ?? 1 }],
        metadata: {
          ...context.subscription.metadata,
          admin_actor_id: userId,
          planName: ADMIN_ORGANIZATION_BILLING_PLAN_LABELS[plan],
          plan_tier: plan,
          stripe_mode: context.config.mode,
        },
        proration_behavior: "none",
      },
      {
        idempotencyKey: [
          "admin-org-plan",
          context.subscription.id,
          context.record.updated_at,
          plan,
        ].join("-"),
      }
    )

    await persistAdminOrganizationSubscriptionSnapshot({
      config: context.config,
      orgId,
      subscription: updated,
      supabase,
    })
    revalidatePath("/organizations")
    return { ok: true }
  } catch (error) {
    logger.error("admin_organization_billing_plan_change_failed", error, {
      orgId,
      plan,
    })
    return {
      error:
        "The plan did not change. Review the subscription in Stripe and try again.",
    }
  }
}

export async function refundLatestAdminOrganizationPaymentAction({
  orgId,
}: {
  orgId: string
}): Promise<AdminOrganizationBillingActionResult> {
  if (!orgId) return { error: "Choose a valid organization." }

  try {
    const { supabase, userId } = await requireAdmin()
    const context = await resolveAdminOrganizationBillingContext({
      orgId,
      supabase,
    })
    if (!context)
      return { error: "This organization has no paid subscription." }

    const latestPayment = await loadLatestAdminOrganizationBillingPayment({
      context,
    })
    if (!latestPayment) {
      return { error: "No refundable subscription payment was found." }
    }

    const refundableAmount = Math.max(
      0,
      latestPayment.charge.amount - latestPayment.charge.amount_refunded
    )
    if (refundableAmount === 0) {
      return { error: "The latest subscription payment is already refunded." }
    }

    const refund = await context.config.client.refunds.create(
      {
        amount: refundableAmount,
        metadata: {
          admin_actor_id: userId,
          org_id: orgId,
          subscription_id: context.subscription.id,
        },
        charge: latestPayment.charge.id,
      },
      {
        idempotencyKey: [
          "admin-org-refund",
          latestPayment.charge.id,
          latestPayment.charge.amount_refunded,
        ].join("-"),
      }
    )

    revalidatePath("/organizations")
    return {
      ok: true,
      refundAmountCents: refund.amount,
      refundStatus: refund.status ?? "pending",
    }
  } catch (error) {
    logger.error("admin_organization_billing_refund_failed", error, { orgId })
    return {
      error: "The payment was not refunded. Review it in Stripe and try again.",
    }
  }
}
