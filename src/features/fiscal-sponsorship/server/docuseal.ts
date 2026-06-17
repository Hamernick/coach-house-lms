import "server-only"

import { env } from "@/lib/env"

type CreateDocuSealSubmissionInput = {
  applicantEmail: string
  applicantName: string
  coachEmail: string
  coachName: string
  documentName: string
  metadata: Record<string, unknown>
}

export type CreateDocuSealSubmissionResult =
  | {
      ok: true
      providerPayload: unknown
      providerSubmissionId: string | null
    }
  | { error: string }

type FiscalSponsorshipDocuSealConfig =
  | {
      apiBaseUrl: string
      apiKey: string
      coachEmail: string
      coachName: string
      templateId: string
    }
  | { error: string }

function resolveProviderSubmissionId(payload: unknown) {
  if (!payload || typeof payload !== "object") return null
  const record = payload as Record<string, unknown>
  const rawId = record.id ?? record.submission_id ?? record.uuid
  return typeof rawId === "string" || typeof rawId === "number"
    ? String(rawId)
    : null
}

export function getFiscalSponsorshipDocuSealConfig(): FiscalSponsorshipDocuSealConfig {
  const apiKey = env.DOCUSEAL_API_KEY
  const templateId = env.DOCUSEAL_AGREEMENT_TEMPLATE_ID
  const coachEmail = env.FISCAL_SPONSORSHIP_SPONSOR_SIGNER_EMAIL
  const coachName = env.FISCAL_SPONSORSHIP_SPONSOR_SIGNER_NAME ?? "Coach House"

  if (!apiKey || !templateId || !coachEmail) {
    return {
      error:
        "DocuSeal is not configured for fiscal sponsorship agreements yet.",
    }
  }

  return {
    apiBaseUrl: env.DOCUSEAL_API_BASE_URL ?? "https://api.docuseal.com",
    apiKey,
    coachEmail,
    coachName,
    templateId,
  }
}

export async function createFiscalSponsorshipDocuSealSubmission({
  applicantEmail,
  applicantName,
  coachEmail,
  coachName,
  documentName,
  metadata,
}: CreateDocuSealSubmissionInput): Promise<CreateDocuSealSubmissionResult> {
  const config = getFiscalSponsorshipDocuSealConfig()
  if ("error" in config) return config

  const response = await fetch(`${config.apiBaseUrl}/submissions`, {
    body: JSON.stringify({
      metadata,
      send_email: true,
      submitters: [
        {
          email: coachEmail,
          name: coachName,
          role: "Coach House",
        },
        {
          email: applicantEmail,
          name: applicantName,
          role: "Applicant",
        },
      ],
      template_id: config.templateId,
      title: documentName,
    }),
    headers: {
      "Content-Type": "application/json",
      "X-Auth-Token": config.apiKey,
    },
    method: "POST",
  })

  const payload = (await response.json().catch(() => null)) as unknown
  if (!response.ok) {
    return {
      error:
        payload && typeof payload === "object" && "error" in payload
          ? String((payload as { error: unknown }).error)
          : "Unable to create DocuSeal signing packet.",
    }
  }

  return {
    ok: true,
    providerPayload: payload,
    providerSubmissionId: resolveProviderSubmissionId(payload),
  }
}
