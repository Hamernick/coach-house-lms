import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database, Json } from "@/lib/supabase"

import {
  planMissionVisionValuesMigration,
  type MvvMigrationAction,
} from "./mvv-migration"
import {
  proposeMissionVisionValuesReview,
  type MvvReviewProposal,
} from "./mvv-review"

export type MvvMigrationOrganizationReport = {
  organizationId: string
  organizationName: string | null
  actions: MvvMigrationAction[]
  changed: boolean
  reviewRequired: boolean
  reviewProposal: MvvReviewProposal | null
  applied: boolean
  error?: string
}

export type MvvMigrationRun = {
  mode: "dry-run" | "apply"
  reports: MvvMigrationOrganizationReport[]
}

/**
 * Runs a read-only inventory by default. Applying is intentionally limited to
 * one explicit organization and uses the row revision to reject stale writes.
 */
export async function runMissionVisionValuesMigration({
  supabase,
  organizationId,
  apply = false,
}: {
  supabase: SupabaseClient<Database, "public">
  organizationId?: string
  apply?: boolean
}): Promise<MvvMigrationRun> {
  const normalizedOrganizationId = organizationId?.trim() ?? ""
  if (apply && !normalizedOrganizationId) {
    throw new Error("Apply requires one explicit organization id.")
  }

  let query = supabase
    .from("organizations")
    .select("user_id, profile, updated_at")
    .order("created_at", { ascending: true })

  if (normalizedOrganizationId) {
    query = query.eq("user_id", normalizedOrganizationId)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const reports: MvvMigrationOrganizationReport[] = []
  for (const row of data ?? []) {
    const profile = (row.profile ?? {}) as Record<string, unknown>
    const plan = planMissionVisionValuesMigration(profile)
    const organizationName =
      typeof profile.name === "string" && profile.name.trim()
        ? profile.name.trim()
        : null
    const report: MvvMigrationOrganizationReport = {
      organizationId: row.user_id,
      organizationName,
      actions: plan.actions,
      changed: plan.changed,
      reviewRequired: plan.reviewRequired,
      reviewProposal: plan.reviewRequired
        ? proposeMissionVisionValuesReview(profile)
        : null,
      applied: false,
    }

    if (apply && plan.changed) {
      const { data: updatedRow, error: updateError } = await supabase
        .from("organizations")
        .update({ profile: plan.nextProfile as Json })
        .eq("user_id", row.user_id)
        .eq("updated_at", row.updated_at)
        .select("user_id")
        .maybeSingle<{ user_id: string }>()

      if (updateError) {
        report.error = updateError.message
      } else if (!updatedRow) {
        report.error = "Organization changed after the migration was planned."
      } else {
        report.applied = true
      }
    }

    reports.push(report)
  }

  return { mode: apply ? "apply" : "dry-run", reports }
}
