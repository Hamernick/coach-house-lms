"use server"

import { buildFiscalSponsorshipFormBPdf } from "../lib/form-b-pdf"
import type { LoadFiscalSponsorshipSigningSessionResult } from "../types"
import {
  buildSigningSession,
  getSignatureForRole,
  parseFormBFields,
  resolveSigningContext,
  toNativeSignature,
} from "./native-signing-context"

export async function loadFiscalSponsorshipSigningSession(
  packetId: string
): Promise<LoadFiscalSponsorshipSigningSessionResult> {
  try {
    const context = await resolveSigningContext(packetId)
    if ("error" in context) return context
    return { ok: true, session: buildSigningSession(context) }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to load the signing session.",
    }
  }
}

export async function buildFiscalSponsorshipSigningPreview(packetId: string) {
  const context = await resolveSigningContext(packetId)
  if ("error" in context) return context
  const documentFields = parseFormBFields(context.document.field_values)
  const draftFields = parseFormBFields(context.draft?.field_values)
  const fields =
    context.role === "applicant"
      ? (draftFields ?? documentFields)
      : documentFields
  if (!fields) return { error: "The Form B field snapshot is unavailable." }
  const applicantRow = getSignatureForRole(context.signatures, "applicant")
  const coachRow = getSignatureForRole(context.signatures, "coach_house")
  const pdf = await buildFiscalSponsorshipFormBPdf({
    applicantSignature: applicantRow ? toNativeSignature(applicantRow) : null,
    coachHouseSignature: coachRow ? toNativeSignature(coachRow) : null,
    fields,
  })
  return { ok: true as const, ...pdf }
}
