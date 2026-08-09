import type Stripe from "stripe"

type StripeBalanceTransactionPage = {
  data: Stripe.BalanceTransaction[]
  has_more: boolean
}

export type StripeBalanceTransactionReader = {
  balanceTransactions: {
    list: (
      params: Stripe.BalanceTransactionListParams,
      options: Stripe.RequestOptions
    ) => Promise<StripeBalanceTransactionPage>
  }
}

const MAX_IMPORT_RECORDS = 500
const PAGE_SIZE = 100

export async function listConnectedStripeBalanceTransactions({
  stripe,
  connectedAccountId,
  createdGte,
  maxRecords = MAX_IMPORT_RECORDS,
}: {
  stripe: StripeBalanceTransactionReader
  connectedAccountId: string
  createdGte: number
  maxRecords?: number
}): Promise<Stripe.BalanceTransaction[]> {
  if (!/^acct_[A-Za-z0-9]+$/.test(connectedAccountId)) {
    throw new Error("A valid connected Stripe account is required.")
  }
  if (!Number.isSafeInteger(createdGte) || createdGte < 0) {
    throw new Error("A valid Stripe import start time is required.")
  }
  if (
    !Number.isSafeInteger(maxRecords) ||
    maxRecords < 1 ||
    maxRecords > MAX_IMPORT_RECORDS
  ) {
    throw new Error(
      `Stripe imports are limited to ${MAX_IMPORT_RECORDS} records.`
    )
  }

  const transactions: Stripe.BalanceTransaction[] = []
  let startingAfter: string | undefined

  while (transactions.length < maxRecords) {
    const page = await stripe.balanceTransactions.list(
      {
        created: { gte: createdGte },
        limit: Math.min(PAGE_SIZE, maxRecords - transactions.length),
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      },
      { stripeAccount: connectedAccountId }
    )

    transactions.push(...page.data.slice(0, maxRecords - transactions.length))

    const lastTransaction = page.data.at(-1)
    if (!page.has_more || !lastTransaction) break
    startingAfter = lastTransaction.id
  }

  return transactions
}
