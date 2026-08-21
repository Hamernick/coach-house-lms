import { env } from "@/lib/env"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

import { parsePublicMapClaimInput } from "../lib"
import type { PublicMapClaimSubmitResult } from "../types"
import {
  hashPublicMapClaimRisk,
  readPublicMapClaimRiskIdentity,
} from "./security"

type SubmitRpcResult = {
  claimId?: unknown
  retryAfterSeconds?: unknown
  status?: unknown
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

async function deliverClaim(claimId: string) {
  const ownerId = env.PUBLIC_MAP_CLAIM_OWNER_USER_ID
  const admin = createSupabaseAdminClient()

  if (!ownerId) {
    await admin
      .from("public_map_claim_requests")
      .update({
        delivery_error: "Claim delivery is not configured.",
        delivery_status: "failed",
      })
      .eq("id", claimId)
    return
  }

  const { data, error } = await admin.rpc("deliver_public_map_claim_request", {
    p_claim_id: claimId,
    p_owner_id: ownerId,
    p_project_id: null,
  })
  const result = asRecord(data)
  if (!error && result?.ok === true) return

  const code = typeof result?.code === "string" ? result.code : null
  await admin
    .from("public_map_claim_requests")
    .update({
      delivery_error: code
        ? `Claim delivery failed: ${code}.`
        : "Claim delivery failed.",
      delivery_status: "failed",
    })
    .eq("id", claimId)
}

export async function submitPublicMapClaimRequest({
  request,
  value,
}: {
  request: Request
  value: unknown
}): Promise<PublicMapClaimSubmitResult & { retryAfterSeconds?: number }> {
  const parsed = parsePublicMapClaimInput(value)
  if (!parsed.success || parsed.data.website) {
    return { code: "invalid", ok: false }
  }

  const input = parsed.data
  const riskKey = hashPublicMapClaimRisk(
    `risk:${readPublicMapClaimRiskIdentity(request)}`
  )
  const emailTargetKey = hashPublicMapClaimRisk(
    `email-target:${input.claimantEmail.toLowerCase()}:${input.targetKind}:${input.targetId ?? input.listingName.toLowerCase()}`
  )
  if (!riskKey || !emailTargetKey) {
    return { code: "unavailable", ok: false }
  }

  const admin = createSupabaseAdminClient()
  const { data, error } = await admin.rpc("submit_public_map_claim_request", {
    p_target_kind: input.targetKind,
    p_target_id: input.targetId ?? null,
    p_listing_name: input.listingName,
    p_claimant_name: input.claimantName,
    p_claimant_email: input.claimantEmail,
    p_message: input.message || null,
    p_submission_key: input.submissionKey,
    p_risk_key: riskKey,
    p_email_target_key: emailTargetKey,
  })
  if (error) return { code: "unavailable", ok: false }

  const result = asRecord(data) as SubmitRpcResult | null
  if (result?.status === "rate_limited") {
    return {
      code: "rate_limited",
      ok: false,
      retryAfterSeconds:
        typeof result.retryAfterSeconds === "number"
          ? result.retryAfterSeconds
          : 3600,
    }
  }
  if (result?.status !== "recorded" || typeof result.claimId !== "string") {
    return { code: "unavailable", ok: false }
  }

  await deliverClaim(result.claimId)
  return { claimId: result.claimId, ok: true }
}

export async function retryPublicMapClaimDelivery(claimId: string) {
  await deliverClaim(claimId)
}
