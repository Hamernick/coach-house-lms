#!/usr/bin/env node

import Stripe from "stripe"

function normalize(value) {
  if (typeof value !== "string") return null
  const trimmed = value.trim().replace(/^['\"]|['\"]$/g, "")
  return trimmed.length > 0 ? trimmed : null
}

function mask(value, keepStart = 6, keepEnd = 4) {
  if (!value) return "missing"
  if (value.length <= keepStart + keepEnd) return value
  return `${value.slice(0, keepStart)}…${value.slice(-keepEnd)}`
}

function modeFromKey(key) {
  if (!key) return "missing"
  if (key.startsWith("sk_live_") || key.startsWith("pk_live_")) return "live"
  if (key.startsWith("sk_test_") || key.startsWith("pk_test_")) return "test"
  return "unknown"
}

async function verifyPrice({ stripe, priceId, label }) {
  if (!priceId) {
    return { ok: false, message: `${label}: missing` }
  }

  try {
    const price = await stripe.prices.retrieve(priceId)
    const recurring = price?.recurring?.interval ?? "n/a"
    return {
      ok: Boolean(price?.id && price.active),
      message: `${label}: ${price.active ? "active" : "inactive"} id=${mask(priceId)} interval=${recurring} currency=${price.currency ?? "n/a"}`,
    }
  } catch (error) {
    return {
      ok: false,
      message: `${label}: ERROR id=${mask(priceId)} type=${error?.type ?? "unknown"} code=${error?.code ?? "unknown"}`,
    }
  }
}

async function verifyConfig({
  name,
  secretKey,
  publishableKey,
  organizationPriceId,
  operationsSupportPriceId,
  promotionCode,
}) {
  if (!secretKey) {
    return {
      ok: false,
      lines: [`[${name}] secret key missing`],
    }
  }

  const secretMode = modeFromKey(secretKey)
  const publishableMode = modeFromKey(publishableKey)
  const modeMismatch = publishableKey ? secretMode !== publishableMode : false
  const lines = [
    `[${name}] secret=${mask(secretKey)} mode=${secretMode} publishable=${mask(publishableKey)} publishableMode=${publishableMode}`,
  ]
  let ok = !modeMismatch

  if (modeMismatch) {
    ok = false
    lines.push(`  - ERROR: secret/publishable mode mismatch`) 
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2025-08-27.basil" })

  const organizationPriceCheck = await verifyPrice({
    stripe,
    priceId: organizationPriceId,
    label: "organization price",
  })
  lines.push(`  - ${organizationPriceCheck.message}`)
  ok = ok && organizationPriceCheck.ok

  const operationsPriceCheck = await verifyPrice({
    stripe,
    priceId: operationsSupportPriceId,
    label: "operations support price",
  })
  lines.push(`  - ${operationsPriceCheck.message}`)
  ok = ok && operationsPriceCheck.ok

  try {
    const activePromotionCodes = await stripe.promotionCodes.list({ active: true, limit: 50 })
    lines.push(`  - active promotion codes: ${activePromotionCodes.data.length}`)

    if (promotionCode) {
      const matched = activePromotionCodes.data.find((promo) => promo.code === promotionCode)
      if (!matched) {
        lines.push(`  - ERROR: promotion code ${promotionCode} not found among active codes`)
        ok = false
      } else {
        const maxRedemptions = matched.max_redemptions ?? matched.coupon?.max_redemptions ?? null
        const timesRedeemed = matched.times_redeemed ?? 0
        lines.push(
          `  - promotion ${promotionCode}: active redeemed=${timesRedeemed}/${maxRedemptions ?? "∞"}`,
        )
      }
    }
  } catch (error) {
    lines.push(
      `  - ERROR: promotion-code lookup failed type=${error?.type ?? "unknown"} code=${error?.code ?? "unknown"}`,
    )
    ok = false
  }

  return { ok, lines }
}

async function main() {
  const promotionCode = normalize(process.env.STRIPE_VERIFY_PROMO_CODE)
  const checks = []

  checks.push(
    await verifyConfig({
      name: "primary",
      secretKey: normalize(process.env.STRIPE_SECRET_KEY),
      publishableKey: normalize(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
      organizationPriceId: normalize(process.env.STRIPE_ORGANIZATION_PRICE_ID),
      operationsSupportPriceId: normalize(process.env.STRIPE_OPERATIONS_SUPPORT_PRICE_ID),
      promotionCode,
    }),
  )

  if (normalize(process.env.STRIPE_TEST_SECRET_KEY)) {
    checks.push(
      await verifyConfig({
        name: "tester",
        secretKey: normalize(process.env.STRIPE_TEST_SECRET_KEY),
        publishableKey: normalize(process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY),
        organizationPriceId: normalize(process.env.STRIPE_TEST_ORGANIZATION_PRICE_ID),
        operationsSupportPriceId: normalize(process.env.STRIPE_TEST_OPERATIONS_SUPPORT_PRICE_ID),
        promotionCode: null,
      }),
    )
  }

  for (const check of checks) {
    for (const line of check.lines) {
      console.log(line)
    }
  }

  if (checks.some((check) => !check.ok)) {
    process.exitCode = 1
    console.error("Stripe runtime verification failed.")
    return
  }

  console.log("Stripe runtime verification passed.")
}

main().catch((error) => {
  console.error("Stripe runtime verification crashed.", error)
  process.exitCode = 1
})
