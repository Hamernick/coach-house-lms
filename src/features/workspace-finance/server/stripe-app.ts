import Stripe from "stripe"

import { env } from "@/lib/env"

const STRIPE_API_VERSION: Stripe.LatestApiVersion = "2025-08-27.basil"
const MARKETPLACE_HOST = "marketplace.stripe.com"
const clients = new Map<string, Stripe>()

function normalize(value: string | null | undefined) {
  const result = value?.trim()
  return result ? result : null
}

function isAllowedRedirect(url: URL) {
  return (
    url.protocol === "https:" ||
    (url.protocol === "http:" &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1"))
  )
}

export function resolveFinanceStripeAppInstallConfig() {
  const rawInstallUrl = normalize(env.FINANCE_STRIPE_APP_INSTALL_URL)
  const rawRedirectUrl = normalize(env.FINANCE_STRIPE_APP_REDIRECT_URL)
  const signingSecret = normalize(env.FINANCE_STRIPE_APP_SIGNING_SECRET)
  if (!rawInstallUrl || !rawRedirectUrl || !signingSecret) return null

  try {
    const installUrl = new URL(rawInstallUrl)
    const redirectUrl = new URL(rawRedirectUrl)
    if (
      installUrl.protocol !== "https:" ||
      installUrl.hostname !== MARKETPLACE_HOST ||
      !isAllowedRedirect(redirectUrl)
    ) {
      return null
    }
    return { installUrl, redirectUrl, signingSecret }
  } catch {
    return null
  }
}

export function resolveFinanceStripeAppClient(livemode: boolean) {
  const secretKey = normalize(
    livemode
      ? env.FINANCE_STRIPE_APP_SECRET_KEY
      : env.FINANCE_STRIPE_APP_TEST_SECRET_KEY
  )
  if (!secretKey) return null
  if (
    livemode
      ? !secretKey.startsWith("sk_live_")
      : !secretKey.startsWith("sk_test_")
  ) {
    return null
  }

  const cached = clients.get(secretKey)
  if (cached) return cached
  const client = new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION })
  clients.set(secretKey, client)
  return client
}

export function verifyFinanceStripeInstallSignature({
  accountId,
  signature,
  state,
  userId,
}: {
  accountId: string
  signature: string
  state: string
  userId: string
}) {
  const config = resolveFinanceStripeAppInstallConfig()
  if (!config) return false
  const verificationClient =
    resolveFinanceStripeAppClient(true) ?? resolveFinanceStripeAppClient(false)
  if (!verificationClient) return false

  const payload = JSON.stringify({
    state,
    user_id: userId,
    account_id: accountId,
  })
  try {
    return verificationClient.webhooks.signature.verifyHeader(
      payload,
      signature,
      config.signingSecret
    )
  } catch {
    return false
  }
}

export function isFinanceStripeAppConfigured() {
  return Boolean(
    resolveFinanceStripeAppInstallConfig() &&
    (resolveFinanceStripeAppClient(true) ||
      resolveFinanceStripeAppClient(false))
  )
}
