"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import Stripe from "stripe"

import { env } from "@/lib/env"
import { requireServerSession } from "@/lib/auth"
import {
  ELECTIVE_ADD_ON_MODULES,
  isElectiveAddOnModuleSlug,
  type ElectiveAddOnModuleSlug,
} from "@/lib/accelerator/elective-modules"
import { ACCELERATOR_MONTHLY_INSTALLMENT_LIMIT } from "@/lib/accelerator/billing"
import type { Database } from "@/lib/supabase"

const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null

type CheckoutMode = "organization" | "accelerator" | "elective"
type AcceleratorVariant = "with_coaching" | "without_coaching"
type AcceleratorBilling = "one_time" | "monthly"

function resolveCheckoutMode(value: FormDataEntryValue | null): CheckoutMode {
  if (value === "accelerator" || value === "elective") return value
  return "organization"
}

function resolveAcceleratorVariant(value: FormDataEntryValue | null): AcceleratorVariant {
  return value === "without_coaching" ? "without_coaching" : "with_coaching"
}

function resolveAcceleratorBilling(value: FormDataEntryValue | null): AcceleratorBilling {
  return value === "monthly" ? "monthly" : "one_time"
}

function resolveElectiveModuleSlug(value: FormDataEntryValue | null): ElectiveAddOnModuleSlug | null {
  if (typeof value !== "string") return null
  return isElectiveAddOnModuleSlug(value) ? value : null
}

function resolveElectivePlanName(slug: ElectiveAddOnModuleSlug | null) {
  if (!slug) return "Elective add-on"
  const entry = ELECTIVE_ADD_ON_MODULES.find((item) => item.slug === slug)
  return entry ? `${entry.title} (Elective)` : "Elective add-on"
}

function resolveElectivePriceId(slug: ElectiveAddOnModuleSlug | null) {
  if (!slug) return null
  if (slug === "retention-and-security") {
    return env.STRIPE_ELECTIVE_RETENTION_AND_SECURITY_PRICE_ID ?? null
  }
  if (slug === "due-diligence") {
    return env.STRIPE_ELECTIVE_DUE_DILIGENCE_PRICE_ID ?? null
  }
  if (slug === "financial-handbook") {
    return env.STRIPE_ELECTIVE_FINANCIAL_HANDBOOK_PRICE_ID ?? null
  }
  return null
}

export async function startCheckout(formData: FormData) {
  const checkoutMode = resolveCheckoutMode(formData.get("checkoutMode"))
  const acceleratorVariant = resolveAcceleratorVariant(formData.get("acceleratorVariant"))
  const acceleratorBilling = resolveAcceleratorBilling(formData.get("acceleratorBilling"))
  const electiveModuleSlug = resolveElectiveModuleSlug(formData.get("electiveModuleSlug"))

  const priceIdEntry = formData.get("priceId")
  const priceId = typeof priceIdEntry === "string" ? priceIdEntry : null
  const planNameEntry = formData.get("planName")
  const planName = typeof planNameEntry === "string" ? planNameEntry : undefined

  const { supabase, session } = await requireServerSession("/pricing")

  const user = session.user

  const requestHeaders = await headers()
  const origin =
    requestHeaders.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

  const userId = user.id

  type SubscriptionStatus = Database["public"]["Enums"]["subscription_status"]
  type SubscriptionInsert = Database["public"]["Tables"]["subscriptions"]["Insert"]

  const redirectToApp = async (status: SubscriptionStatus) => {
    if (checkoutMode === "accelerator") {
      redirect(`/my-organization?purchase=accelerator`)
    }
    if (checkoutMode === "elective") {
      const query = electiveModuleSlug ? `&elective=${encodeURIComponent(electiveModuleSlug)}` : ""
      redirect(`/my-organization?purchase=elective${query}`)
    }

    const resolvedPlanName = planName ?? "Organization"

    const payload: SubscriptionInsert = {
      user_id: userId,
      stripe_subscription_id: `stub_${Date.now()}`,
      status,
      metadata: resolvedPlanName ? { planName: resolvedPlanName } : null,
    }

    await supabase
      .from("subscriptions" satisfies keyof Database["public"]["Tables"])
      .upsert<SubscriptionInsert>(payload, { onConflict: "stripe_subscription_id" })

    redirect(`/my-organization?subscription=${status}`)
  }

  if (!stripe) {
    await redirectToApp("trialing")
  }

  try {
    const stripeClient = stripe!
    const resolvedPlanName =
      planName ??
      (checkoutMode === "accelerator"
        ? acceleratorVariant === "without_coaching"
          ? "Accelerator Base"
          : "Accelerator Pro"
        : checkoutMode === "elective"
          ? resolveElectivePlanName(electiveModuleSlug)
        : "Organization")

    const resolvePriceId = (candidate: string | null | undefined) =>
      candidate && candidate.startsWith("price_") ? candidate : null

    const organizationPriceId =
      resolvePriceId(checkoutMode === "organization" ? priceId : null) ??
      resolvePriceId(env.STRIPE_ORGANIZATION_PRICE_ID)
    const withCoachingPriceId =
      resolvePriceId(env.STRIPE_ACCELERATOR_WITH_COACHING_PRICE_ID) ??
      resolvePriceId(env.STRIPE_ACCELERATOR_PRICE_ID)
    const withoutCoachingPriceId = resolvePriceId(env.STRIPE_ACCELERATOR_WITHOUT_COACHING_PRICE_ID)
    const withCoachingMonthlyPriceId = resolvePriceId(env.STRIPE_ACCELERATOR_WITH_COACHING_MONTHLY_PRICE_ID)
    const withoutCoachingMonthlyPriceId = resolvePriceId(env.STRIPE_ACCELERATOR_WITHOUT_COACHING_MONTHLY_PRICE_ID)
    const acceleratorPriceId =
      resolvePriceId(checkoutMode === "accelerator" ? priceId : null) ??
      (acceleratorBilling === "monthly"
        ? acceleratorVariant === "without_coaching"
          ? withoutCoachingMonthlyPriceId
          : withCoachingMonthlyPriceId
        : acceleratorVariant === "without_coaching"
          ? withoutCoachingPriceId
          : withCoachingPriceId)
    const electivePriceId =
      resolvePriceId(checkoutMode === "elective" ? priceId : null) ??
      resolvePriceId(resolveElectivePriceId(electiveModuleSlug))

    if (checkoutMode === "accelerator") {
      if (!acceleratorPriceId) {
        await redirectToApp("trialing")
      }
      const coachingIncluded = acceleratorVariant === "with_coaching"

      if (acceleratorBilling === "monthly") {
        const sessionParams: Stripe.Checkout.SessionCreateParams = {
          mode: "subscription",
          allow_promotion_codes: true,
          client_reference_id: userId,
          customer_email: user.email ?? undefined,
          metadata: {
            kind: "accelerator",
            user_id: userId,
            planName: resolvedPlanName,
            accelerator_variant: acceleratorVariant,
            coaching_included: String(coachingIncluded),
            accelerator_billing: acceleratorBilling,
            accelerator_installment_limit: String(ACCELERATOR_MONTHLY_INSTALLMENT_LIMIT),
            accelerator_installments_paid: "0",
          },
          line_items: [{ price: acceleratorPriceId!, quantity: 1 }],
          subscription_data: {
            metadata: {
              kind: "accelerator",
              user_id: userId,
              planName: resolvedPlanName,
              accelerator_variant: acceleratorVariant,
              coaching_included: String(coachingIncluded),
              accelerator_billing: acceleratorBilling,
              accelerator_installment_limit: String(ACCELERATOR_MONTHLY_INSTALLMENT_LIMIT),
              accelerator_installments_paid: "0",
            },
          },
          success_url: `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/pricing?cancelled=true`,
        }

        const checkout = await stripeClient.checkout.sessions.create(sessionParams)
        if (!checkout.url) {
          await redirectToApp("trialing")
        }
        redirect(checkout.url!)
      }

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: "payment",
        allow_promotion_codes: true,
        client_reference_id: userId,
        customer_email: user.email ?? undefined,
        customer_creation: "always",
        metadata: {
          kind: "accelerator",
          user_id: userId,
          planName: resolvedPlanName,
          accelerator_variant: acceleratorVariant,
          coaching_included: String(coachingIncluded),
          accelerator_billing: acceleratorBilling,
        },
        payment_intent_data: {
          receipt_email: user.email ?? undefined,
          metadata: {
            kind: "accelerator",
            user_id: userId,
            planName: resolvedPlanName,
            accelerator_variant: acceleratorVariant,
            coaching_included: String(coachingIncluded),
            accelerator_billing: acceleratorBilling,
          },
        },
        line_items: [{ price: acceleratorPriceId!, quantity: 1 }],
        success_url: `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/pricing?cancelled=true`,
      }

      const checkout = await stripeClient.checkout.sessions.create(sessionParams)

      if (!checkout.url) {
        await redirectToApp("trialing")
      }

      redirect(checkout.url!)
    }

    if (checkoutMode === "elective") {
      if (!electiveModuleSlug || !electivePriceId) {
        redirect("/pricing?plan=electives&cancelled=true")
      }

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: "payment",
        allow_promotion_codes: true,
        client_reference_id: userId,
        customer_email: user.email ?? undefined,
        customer_creation: "always",
        metadata: {
          kind: "elective",
          user_id: userId,
          planName: resolvedPlanName,
          elective_module_slug: electiveModuleSlug,
        },
        payment_intent_data: {
          receipt_email: user.email ?? undefined,
          metadata: {
            kind: "elective",
            user_id: userId,
            planName: resolvedPlanName,
            elective_module_slug: electiveModuleSlug,
          },
        },
        line_items: [{ price: electivePriceId, quantity: 1 }],
        success_url: `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/pricing?cancelled=true`,
      }

      const checkout = await stripeClient.checkout.sessions.create(sessionParams)

      if (!checkout.url) {
        redirect("/pricing?plan=electives&cancelled=true")
      }

      redirect(checkout.url)
    }

    if (!organizationPriceId) {
      await redirectToApp("trialing")
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      allow_promotion_codes: true,
      client_reference_id: userId,
      customer_email: user.email ?? undefined,
      line_items: [
        {
          price: organizationPriceId!,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          user_id: userId,
          planName: resolvedPlanName,
        },
      },
      success_url: `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?cancelled=true`,
    }

    const checkout = await stripeClient.checkout.sessions.create(sessionParams)

    if (!checkout.url) {
      await redirectToApp("trialing")
    }

    redirect(checkout.url!)
  } catch (error) {
    if (
      isRedirectError(error) ||
      (error instanceof Error && error.message.startsWith("redirect:"))
    ) {
      throw error
    }
    console.warn("Unable to start Stripe checkout", error)
    await redirectToApp("trialing")
  }
}
