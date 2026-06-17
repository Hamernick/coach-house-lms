import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase"
import {
  FISCAL_SPONSORSHIP_REQUIRED_DOCUMENTS,
  formatFiscalSponsorshipDocumentKey,
} from "../lib/required-documents"
import type { FiscalSponsorshipDocumentKey } from "../types"

type FiscalWorkflowActionClient = Pick<
  SupabaseClient<Database, "public">,
  "from"
>

const FISCAL_DOCUMENT_KEYS = new Set(
  FISCAL_SPONSORSHIP_REQUIRED_DOCUMENTS.map((requirement) => requirement.key)
)

export type ProjectAssetRow = {
  id: string
  asset_type: string
  description: string | null
  external_url: string | null
  mime: string | null
  name: string
  org_id: string
  project_id: string
  size_bytes: number | null
  storage_path: string | null
}

export function resolveDocumentKindForKey(key: FiscalSponsorshipDocumentKey) {
  return [
    "closeout_report",
    "grant_request_support",
    "grantee_report",
  ].includes(key)
    ? "regrant"
    : "application"
}

export function formatDocumentKeyLabel(key: FiscalSponsorshipDocumentKey) {
  return formatFiscalSponsorshipDocumentKey(key)
}

export function normalizeFiscalDocumentKey(
  key: string
): FiscalSponsorshipDocumentKey | null {
  return FISCAL_DOCUMENT_KEYS.has(key as FiscalSponsorshipDocumentKey)
    ? (key as FiscalSponsorshipDocumentKey)
    : null
}

export async function loadProjectAssetForFiscalDocument({
  assetId,
  orgId,
  projectId,
  supabase,
}: {
  assetId: string
  orgId: string
  projectId: string
  supabase: FiscalWorkflowActionClient
}): Promise<{ asset: ProjectAssetRow } | { error: string }> {
  const { data, error } = await supabase
    .from("organization_project_assets")
    .select(
      "id, asset_type, description, external_url, mime, name, org_id, project_id, size_bytes, storage_path"
    )
    .eq("id", assetId)
    .eq("project_id", projectId)
    .eq("org_id", orgId)
    .maybeSingle<ProjectAssetRow>()

  if (error || !data) {
    return { error: "Choose an uploaded project asset for this requirement." }
  }

  return { asset: data }
}
