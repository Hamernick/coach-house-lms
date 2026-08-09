import { createHash, randomBytes } from "node:crypto"
import { NextResponse, type NextRequest } from "next/server"

import { resolveFinanceStripeAppInstallConfig } from "@/actions/workspace-finance-stripe-support"
import { resolveAuthenticatedAppContext } from "@/lib/auth/request-context"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { canManageWorkspaceFinance } from "@/lib/workspace/workspace-finance-access"

const RECORD_TYPES = new Set([
  "donation",
  "grant",
  "earned_revenue",
  "other_income",
])

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin")
  return Boolean(origin && origin === request.nextUrl.origin)
}

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status })
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return errorResponse("Invalid request origin.", 403)

  let context: Awaited<ReturnType<typeof resolveAuthenticatedAppContext>>
  try {
    context = await resolveAuthenticatedAppContext()
  } catch {
    return errorResponse("Unauthorized", 401)
  }

  if (
    !(await canManageWorkspaceFinance({
      activeOrg: context.activeOrg,
      supabase: context.supabase,
      userId: context.user.id,
    }))
  ) {
    return errorResponse("Only Finance managers can connect Stripe.", 403)
  }

  const config = resolveFinanceStripeAppInstallConfig()
  if (!config) return errorResponse("Stripe connection is not configured.", 503)

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return errorResponse("Unable to read the Stripe connection settings.", 400)
  }
  const defaultRecordType = String(form.get("defaultRecordType") ?? "")
  if (!RECORD_TYPES.has(defaultRecordType)) {
    return errorResponse(
      "Choose how incoming Stripe payments are recorded.",
      400
    )
  }

  let admin: ReturnType<typeof createSupabaseAdminClient>
  try {
    admin = createSupabaseAdminClient()
  } catch {
    return errorResponse("Stripe connection storage is not configured.", 503)
  }

  const state = randomBytes(32).toString("hex")
  const stateSha256 = createHash("sha256").update(state).digest("hex")
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
  const { error } = await admin
    .from("organization_finance_stripe_install_intents")
    .insert({
      org_id: context.activeOrg.orgId,
      user_id: context.user.id,
      state_sha256: stateSha256,
      default_record_type: defaultRecordType,
      expires_at: expiresAt,
    })

  if (error) return errorResponse("Unable to start the Stripe connection.", 500)

  const installUrl = new URL(config.installUrl)
  installUrl.searchParams.set("redirect_uri", config.redirectUrl.toString())
  installUrl.searchParams.set("state", state)
  return NextResponse.redirect(installUrl, 303)
}
