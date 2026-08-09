import { createSupabaseAdminClient } from "@/lib/supabase/admin"

import { buildResourceMapReviewSummary } from "../lib/review-view-model"
import type {
  ResourceMapAdminEnrichmentRunRow,
  ResourceMapAdminFieldEvidenceRow,
  ResourceMapAdminImportRecordDetailRow,
} from "../types"

type ResourceMapAdminClient = ReturnType<typeof createSupabaseAdminClient>

export async function assertResourceMapImportReadyForApproval({
  admin,
  record,
}: {
  admin: ResourceMapAdminClient
  record: Record<string, unknown>
}) {
  const importRecord = record as ResourceMapAdminImportRecordDetailRow
  const [evidence, enrichmentRuns, unresolvedMatches] = await Promise.all([
    admin
      .from("resource_map_field_evidence")
      .select(
        "id,import_record_id,field_path,field_value,confidence_score,source_url,evidence_type,derived_from,transformation,evidence_metadata,observed_at"
      )
      .eq("import_record_id", importRecord.id),
    admin
      .from("resource_map_enrichment_runs")
      .select(
        "id,import_record_id,pass_type,pass_number,status,provider,model,prompt_version,source_urls,structured_result,issues,error_message,actor_id,completed_at,created_at"
      )
      .eq("import_record_id", importRecord.id)
      .order("created_at", { ascending: false }),
    admin
      .from("resource_map_import_record_matches")
      .select("id,match_status")
      .eq("import_record_id", importRecord.id)
      .in("match_status", ["pending", "accepted"]),
  ])

  for (const result of [evidence, enrichmentRuns, unresolvedMatches]) {
    if (result.error) throw new Error(result.error.message)
  }

  if ((unresolvedMatches.data ?? []).length > 0) {
    throw new Error(
      "Resolve pending or accepted duplicate matches before approval."
    )
  }

  const summary = buildResourceMapReviewSummary({
    record: importRecord,
    evidence: (evidence.data ?? []) as ResourceMapAdminFieldEvidenceRow[],
    enrichmentRuns: (enrichmentRuns.data ??
      []) as ResourceMapAdminEnrichmentRunRow[],
  })
  if (!summary.readyForHumanApproval) {
    const blockers = summary.blockers.slice(0, 5).join("; ")
    throw new Error(
      `Resolve publication-readiness blockers before approval: ${blockers}`
    )
  }
}
