import Stripe from "stripe"

import { env } from "@/lib/env"

export type StripeRuntimeTarget = "primary" | "tester"
export type StripeBillingPlanTier = "organization" | "operations_support"

export type StripeRuntimeConfig = {
  target: StripeRuntimeTarget
  client: Stripe
  secretKey: string
  webhookSecret: string | null
  organizationPriceId: string | null
  operationsSupportPriceId: string | null
  coachingFullPriceId: string | null
  coachingDiscountedPriceId: string | null
  mode: "test" | "live"
}

const STRIPE_API_VERSION: Stripe.LatestApiVersion = "2025-08-27.basil"
const clientCache = new Map<string, Stripe>()

function normalizeString(value: string | null | undefined) {
  if (typeof value !== "string") return null

  let normalized = value.trim()
  if (normalized.length === 0) return null

  const hasDoubleQuotes = normalized.startsWith("\"") && normalized.endsWith("\"")
  const hasSingleQuotes = normalized.startsWith("'") && normalized.endsWith("'")
  if ((hasDoubleQuotes || hasSingleQuotes) && normalized.length > 1) {
    normalized = normalized.slice(1, -1).trim()
  }

  normalized = normalized
    .replace(/\\r\\n/g, "")
    .replace(/\\n/g, "")
    .replace(/\r?\n/g, "")
    .trim()

  return normalized.length > 0 ? normalized : null
}

function modeFromSecretKey(secretKey: string): "test" | "live" {
  return secretKey.startsWith("sk_test_") ? "test" : "live"
}

function createClient(secretKey: string) {
  const cached = clientCache.get(secretKey)
  if (cached) return cached
  const client = new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION })
  clientCache.set(secretKey, client)
  return client
}

function buildPrimaryConfig(): StripeRuntimeConfig | null {
  const secretKey = normalizeString(env.STRIPE_SECRET_KEY)
  if (!secretKey) return null
  return {
    target: "primary",
    client: createClient(secretKey),
    secretKey,
    webhookSecret: normalizeString(env.STRIPE_WEBHOOK_SECRET),
    organizationPriceId: normalizeString(env.STRIPE_ORGANIZATION_PRICE_ID),
    operationsSupportPriceId: normalizeString(env.STRIPE_OPERATIONS_SUPPORT_PRICE_ID),
    coachingFullPriceId: normalizeString(env.STRIPE_COACHING_FULL_PRICE_ID),
    coachingDiscountedPriceId: normalizeString(env.STRIPE_COACHING_DISCOUNTED_PRICE_ID),
    mode: modeFromSecretKey(secretKey),
  }
}

function buildTesterConfig(): StripeRuntimeConfig | null {
  const testerSecret = normalizeString(env.STRIPE_TEST_SECRET_KEY)
  if (!testerSecret) return null
  return {
    target: "tester",
    client: createClient(testerSecret),
    secretKey: testerSecret,
    webhookSecret: normalizeString(env.STRIPE_TEST_WEBHOOK_SECRET),
    organizationPriceId: normalizeString(env.STRIPE_TEST_ORGANIZATION_PRICE_ID),
    operationsSupportPriceId: normalizeString(env.STRIPE_TEST_OPERATIONS_SUPPORT_PRICE_ID),
    coachingFullPriceId: normalizeString(env.STRIPE_TEST_COACHING_FULL_PRICE_ID),
    coachingDiscountedPriceId: normalizeString(env.STRIPE_TEST_COACHING_DISCOUNTED_PRICE_ID),
    mode: modeFromSecretKey(testerSecret),
  }
}

function dedupeConfigs(configs: Array<StripeRuntimeConfig | null>) {
  const deduped: StripeRuntimeConfig[] = []
  const seen = new Set<string>()
  for (const config of configs) {
    if (!config) continue
    const key = `${config.secretKey}:${config.webhookSecret ?? ""}`
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(config)
  }
  return deduped
}

export function resolveStripeRuntimeConfigForAudience({
  isTester,
}: {
  isTester: boolean
}): StripeRuntimeConfig | null {
  const primary = buildPrimaryConfig()
  const tester = buildTesterConfig()
  if (process.env.NODE_ENV !== "production" && isTester && tester) return tester
  return primary
}

function hasConfiguredCoachingPrice({
  config,
  priceTier,
}: {
  config: StripeRuntimeConfig | null
  priceTier: "discounted" | "full"
}) {
  if (!config) return false
  return Boolean(resolveStripePriceIdForCoaching({ config, priceTier }))
}

function shouldPreferTesterForLocalCoaching({
  tester,
  priceTier,
}: {
  tester: StripeRuntimeConfig | null
  priceTier: "discounted" | "full"
}) {
  return process.env.NODE_ENV !== "production" && hasConfiguredCoachingPrice({ config: tester, priceTier })
}

export function resolveStripeRuntimeConfigForCoaching({
  useTesterRuntime,
  priceTier,
}: {
  useTesterRuntime: boolean
  priceTier: "discounted" | "full"
}): StripeRuntimeConfig | null {
  const primary = buildPrimaryConfig()
  const tester = buildTesterConfig()
  if ((useTesterRuntime || shouldPreferTesterForLocalCoaching({ tester, priceTier })) && tester) {
    return tester
  }
  return primary
}

export function isStripeCoachingCheckoutConfigured({
  useTesterRuntime,
  priceTier,
}: {
  useTesterRuntime: boolean
  priceTier: "discounted" | "full"
}) {
  const config = resolveStripeRuntimeConfigForCoaching({ useTesterRuntime, priceTier })
  return hasConfiguredCoachingPrice({ config, priceTier })
}

export function resolveStripeRuntimeConfigsForFallback({
  preferTester,
}: {
  preferTester: boolean
}) {
  const primary = buildPrimaryConfig()
  const tester = buildTesterConfig()
  return preferTester ? dedupeConfigs([tester, primary]) : dedupeConfigs([primary, tester])
}

export function resolveStripeWebhookRuntimeConfigs() {
  return dedupeConfigs([buildPrimaryConfig(), buildTesterConfig()]).filter(
    (config) => typeof config.webhookSecret === "string" && config.webhookSecret.length > 0,
  )
}

export function resolveStripePublishableKeyForAudience({
  isTester,
}: {
  isTester: boolean
}) {
  const primary = normalizeString(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  const tester = normalizeString(env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY)
  if (isTester) return tester ?? primary
  return primary
}

export function resolveStripePriceIdForPlan({
  config,
  planTier,
}: {
  config: StripeRuntimeConfig
  planTier: StripeBillingPlanTier
}) {
  return planTier === "operations_support" ? config.operationsSupportPriceId : config.organizationPriceId
}

export function resolveStripePriceIdForCoaching({
  config,
  priceTier,
}: {
  config: StripeRuntimeConfig
  priceTier: "discounted" | "full"
}) {
  return priceTier === "discounted" ? config.coachingDiscountedPriceId : config.coachingFullPriceId
}
