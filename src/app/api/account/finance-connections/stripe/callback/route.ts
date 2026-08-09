import { createHash } from "node:crypto"
import { revalidatePath } from "next/cache"
import { NextResponse, type NextRequest } from "next/server"

import {
  resolveFinanceStripeAppInstallConfig,
  verifyFinanceStripeInstallSignature,
} from "@/actions/workspace-finance-stripe-support"
import { resolveAuthenticatedAppContext } from "@/lib/auth/request-context"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { canManageWorkspaceFinance } from "@/lib/workspace/workspace-finance-access"

const ACCOUNT_PATTERN = /^acct_[A-Za-z0-9]+$/
const USER_PATTERN = /^[A-Za-z0-9_-]{1,128}$/
const STATE_PATTERN = /^[a-f0-9]{64}$/

function financeRedirect(request: NextRequest, result: string) {
  const config = resolveFinanceStripeAppInstallConfig()
  const url = new URL(
    "/workspace",
    config?.redirectUrl ?? new URL(request.url).origin
  )
  url.searchParams.set("drawer", "finance")
  url.searchParams.set("financeStripe", result)
  return NextResponse.redirect(url, 303)
}

export async function GET(request: NextRequest) {
  const config = resolveFinanceStripeAppInstallConfig()
  if (!config) return financeRedirect(request, "unavailable")

  const actualUrl = new URL(request.url)
  if (
    actualUrl.origin !== config.redirectUrl.origin ||
    actualUrl.pathname !== config.redirectUrl.pathname
  ) {
    return financeRedirect(request, "invalid")
  }

  if (actualUrl.searchParams.has("error")) {
    return financeRedirect(request, "cancelled")
  }

  let context: Awaited<ReturnType<typeof resolveAuthenticatedAppContext>>
  try {
    context = await resolveAuthenticatedAppContext()
  } catch {
    return financeRedirect(request, "unauthorized")
  }
  if (
    !(await canManageWorkspaceFinance({
      activeOrg: context.activeOrg,
      supabase: context.supabase,
      userId: context.user.id,
    }))
  ) {
    return financeRedirect(request, "forbidden")
  }

  const accountId = actualUrl.searchParams.get("account_id") ?? ""
  const stripeUserId = actualUrl.searchParams.get("user_id") ?? ""
  const state = actualUrl.searchParams.get("state") ?? ""
  const signature = actualUrl.searchParams.get("install_signature") ?? ""
  if (
    !ACCOUNT_PATTERN.test(accountId) ||
    !USER_PATTERN.test(stripeUserId) ||
    !STATE_PATTERN.test(state) ||
    !signature ||
    !verifyFinanceStripeInstallSignature({
      accountId,
      signature,
      state,
      userId: stripeUserId,
    })
  ) {
    return financeRedirect(request, "invalid")
  }

  let admin: ReturnType<typeof createSupabaseAdminClient>
  try {
    admin = createSupabaseAdminClient()
  } catch {
    return financeRedirect(request, "unavailable")
  }

  const stateSha256 = createHash("sha256").update(state).digest("hex")
  const { data, error } = await admin.rpc(
    "complete_organization_finance_stripe_install",
    {
      p_state_sha256: stateSha256,
      p_user_id: context.user.id,
      p_stripe_account_id: accountId,
      p_stripe_user_id: stripeUserId,
      p_livemode: actualUrl.searchParams.get("livemode") !== "false",
    }
  )

  if (
    error ||
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    data.orgId !== context.activeOrg.orgId
  ) {
    return financeRedirect(request, "invalid")
  }

  revalidatePath("/workspace")
  revalidatePath("/my-organization")
  revalidatePath("/organization/workspace")
  return financeRedirect(request, "connected")
}
