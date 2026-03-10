import type { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase"

export type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

export type SubmissionStatus = Database["public"]["Enums"]["submission_status"]

export type AnswersPayload = Record<string, unknown>

export type SanitizedResult = {
  answers: Record<string, unknown>
  missingRequired: string[]
}

export type AssignmentSchema = {
  fields?: Array<{
    name?: unknown
    org_key?: unknown
    orgKey?: unknown
  }>
}

export type ModuleMeta = {
  id: string
  idx: number | null
  title: string
  class_id: string
  classes: { slug: string | null; title: string | null } | null
}
