import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase"

import type {
  WorkspaceFinanceCorrectionInput,
  WorkspaceFinanceRecordInput,
  WorkspaceFinanceRecordStatus,
  WorkspaceFinanceSourceKind,
} from "../types"
import { getWorkspaceFinanceRecordTypeLabel } from "../lib/record-types"

type OrganizationFinanceRecordRow =
  Database["public"]["Tables"]["organization_finance_records"]["Row"]
type OrganizationFinanceEvidenceRow = Pick<
  Database["public"]["Tables"]["organization_finance_record_evidence"]["Row"],
  "id" | "record_id" | "external_reference" | "file_name" | "created_at"
>
type OrganizationFinanceCorrectionRow = Pick<
  Database["public"]["Tables"]["organization_finance_record_corrections"]["Row"],
  | "id"
  | "original_record_id"
  | "replacement_record_id"
  | "reason"
  | "created_at"
>

export function mapOrganizationFinanceRecord(
  record: OrganizationFinanceRecordRow,
  evidence?: OrganizationFinanceEvidenceRow,
  correction?: WorkspaceFinanceCorrectionInput
): WorkspaceFinanceRecordInput {
  return {
    id: record.id,
    programId: record.program_id,
    effectiveAt: record.effective_at,
    sourceLabel: record.source_label,
    recordType: record.record_type,
    typeLabel: getWorkspaceFinanceRecordTypeLabel(record.record_type),
    amountCents: record.amount_cents,
    currencyCode: record.currency_code,
    direction: record.direction as "in" | "out",
    status: record.status as WorkspaceFinanceRecordStatus,
    sourceKind: record.source_kind as WorkspaceFinanceSourceKind | null,
    ...(correction ? { correction } : {}),
    ...(evidence
      ? {
          reconciliation: {
            evidenceId: evidence.id,
            externalReference: evidence.external_reference,
            fileName: evidence.file_name,
            reconciledAt: record.reconciled_at ?? evidence.created_at,
          },
        }
      : {}),
  }
}

export async function loadOrganizationFinanceRecords({
  orgId,
  supabase,
}: {
  orgId: string
  supabase: SupabaseClient<Database>
}): Promise<WorkspaceFinanceRecordInput[]> {
  const { data, error } = await supabase
    .from("organization_finance_records")
    .select(
      "id,org_id,program_id,effective_at,record_type,direction,source_kind,source_label,amount_cents,currency_code,status,external_provider,external_record_id,created_source,created_by,reconciled_at,created_at,updated_at"
    )
    .eq("org_id", orgId)
    .order("effective_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(500)

  if (error) {
    throw new Error("Unable to load Finance history.", { cause: error })
  }

  const rows = data ?? []
  if (!rows.length) return []

  const [evidenceResult, correctionsResult] = await Promise.all([
    supabase
      .from("organization_finance_record_evidence")
      .select("id,record_id,external_reference,file_name,created_at")
      .eq("org_id", orgId)
      .in(
        "record_id",
        rows.map((record) => record.id)
      )
      .limit(500)
      .returns<OrganizationFinanceEvidenceRow[]>(),
    supabase
      .from("organization_finance_record_corrections")
      .select("id,original_record_id,replacement_record_id,reason,created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(500)
      .returns<OrganizationFinanceCorrectionRow[]>(),
  ])

  if (evidenceResult.error) {
    throw new Error("Unable to load Finance verification evidence.", {
      cause: evidenceResult.error,
    })
  }
  if (correctionsResult.error) {
    throw new Error("Unable to load Finance corrections.", {
      cause: correctionsResult.error,
    })
  }

  const evidenceByRecordId = new Map(
    (evidenceResult.data ?? []).map((item) => [item.record_id, item])
  )
  const correctionsByRecordId = buildCorrectionMap(correctionsResult.data ?? [])
  return rows.map((record) =>
    mapOrganizationFinanceRecord(
      record,
      evidenceByRecordId.get(record.id),
      correctionsByRecordId.get(record.id)
    )
  )
}

function buildCorrectionMap(rows: OrganizationFinanceCorrectionRow[]) {
  const corrections = new Map<string, WorkspaceFinanceCorrectionInput>()
  for (const row of rows) {
    corrections.set(row.original_record_id, {
      correctionId: row.id,
      correctedAt: row.created_at,
      reason: row.reason,
      relatedRecordId: row.replacement_record_id,
      state: "corrected",
    })
    corrections.set(row.replacement_record_id, {
      correctionId: row.id,
      correctedAt: row.created_at,
      reason: row.reason,
      relatedRecordId: row.original_record_id,
      state: "replacement",
    })
  }
  return corrections
}
