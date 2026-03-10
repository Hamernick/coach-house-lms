import Stripe from "stripe"

import {
  resolveStripeRuntimeConfigsForFallback,
  type StripeRuntimeConfig,
} from "@/lib/billing/stripe-runtime"

type StripePriceLookupDiagnostic = {
  target: StripeRuntimeConfig["target"]
  mode: StripeRuntimeConfig["mode"]
  found: boolean
  errorType: string | null
  errorCode: string | null
}

export type StripeCheckoutPriceDiagnostics = {
  selected: StripePriceLookupDiagnostic
  alternates: StripePriceLookupDiagnostic[]
  suspectedModeOrAccountMismatch: boolean
  hint: string | null
}

async function lookupPriceInConfig({
  config,
  priceId,
}: {
  config: StripeRuntimeConfig
  priceId: string
}): Promise<StripePriceLookupDiagnostic> {
  try {
    const price = await config.client.prices.retrieve(priceId)
    return {
      target: config.target,
      mode: config.mode,
      found: Boolean(price?.id),
      errorType: null,
      errorCode: null,
    }
  } catch (error) {
    const stripeError = error as Stripe.errors.StripeError | null
    return {
      target: config.target,
      mode: config.mode,
      found: false,
      errorType: stripeError?.type ?? null,
      errorCode: stripeError?.code ?? null,
    }
  }
}

export async function collectStripeCheckoutPriceDiagnostics({
  priceId,
  selectedConfig,
  preferTester,
}: {
  priceId: string
  selectedConfig: StripeRuntimeConfig
  preferTester: boolean
}): Promise<StripeCheckoutPriceDiagnostics> {
  const [selected, alternates] = await Promise.all([
    lookupPriceInConfig({ config: selectedConfig, priceId }),
    Promise.all(
      resolveStripeRuntimeConfigsForFallback({ preferTester })
        .filter((config) => config.secretKey !== selectedConfig.secretKey)
        .map((config) => lookupPriceInConfig({ config, priceId })),
    ),
  ])

  const selectedMissingResource =
    !selected.found && selected.errorType === "StripeInvalidRequestError" && selected.errorCode === "resource_missing"
  const foundInAlternate = alternates.some((candidate) => candidate.found)
  const suspectedModeOrAccountMismatch = selectedMissingResource && foundInAlternate

  let hint: string | null = null
  if (suspectedModeOrAccountMismatch) {
    hint = "Configured price was missing in selected Stripe runtime but exists in alternate runtime (likely tester/live routing or env mismatch)."
  } else if (selectedMissingResource) {
    hint = "Configured price was not found in the selected Stripe runtime (likely stale/missing price ID or wrong Stripe account key)."
  }

  return {
    selected,
    alternates,
    suspectedModeOrAccountMismatch,
    hint,
  }
}
