import { NextResponse } from "next/server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase"
import type { Json } from "@/lib/supabase/schema/json"
import { parseAssignmentFields } from "@/lib/modules"
import { revalidateClassViews } from "@/app/(admin)/admin/classes/actions"
import { processModuleCompletion } from "./_lib/completion"
import { syncMappedAnswersToOrganizationProfile } from "./_lib/profile-sync"
import { extractOrgKeyMappings, sanitizeAnswers } from "./_lib/sanitize"
import type { AnswersPayload, ModuleMeta, SubmissionStatus } from "./_lib/types"

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: moduleId } = await context.params
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 })
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let payload: { answers?: AnswersPayload; status?: SubmissionStatus }
  try {
    payload = (await request.json()) as typeof payload
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const desiredStatus: SubmissionStatus = "submitted"
  const answersRaw = (payload.answers ?? {}) as AnswersPayload

  const { data: moduleMeta, error: moduleError } = await supabase
    .from("modules" satisfies keyof Database["public"]["Tables"])
    .select("id, idx, title, class_id, classes ( slug, title )")
    .eq("id", moduleId)
    .maybeSingle<ModuleMeta>()

  if (moduleError) {
    return NextResponse.json({ error: moduleError.message }, { status: 500 })
  }

  if (!moduleMeta) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 })
  }

  const { data: assignmentRow, error: assignmentError } = await supabase
    .from("module_assignments" satisfies keyof Database["public"]["Tables"])
    .select("schema, complete_on_submit")
    .eq("module_id", moduleId)
    .maybeSingle<{ schema: unknown; complete_on_submit: boolean | null }>()

  if (assignmentError) {
    return NextResponse.json({ error: assignmentError.message }, { status: 500 })
  }

  if (!assignmentRow) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
  }

  const slug = moduleMeta.classes?.slug ?? null
  const modulePath = slug && typeof moduleMeta.idx === "number" ? `/class/${slug}/module/${moduleMeta.idx}` : null

  const fields = parseAssignmentFields(assignmentRow.schema)
  const { answers: sanitizedAnswers, missingRequired } = sanitizeAnswers(fields, answersRaw)

  const orgKeyMapping = extractOrgKeyMappings(assignmentRow.schema)

  if (missingRequired.length > 0) {
    return NextResponse.json(
      {
        error: "Missing required answers",
        missing: missingRequired,
      },
      { status: 400 },
    )
  }

  const upsertPayload: Database["public"]["Tables"]["assignment_submissions"]["Insert"] = {
    module_id: moduleId,
    user_id: user.id,
    answers: sanitizedAnswers as Json,
    status: desiredStatus,
  }

  const { data: submissionRows, error: upsertError } = await supabase
    .from("assignment_submissions" satisfies keyof Database["public"]["Tables"])
    .upsert(upsertPayload, { onConflict: "module_id,user_id" })
    .select("module_id, answers, status, updated_at")
    .maybeSingle<{ module_id: string; answers: Record<string, unknown>; status: SubmissionStatus; updated_at: string | null }>()

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  await syncMappedAnswersToOrganizationProfile({
    supabase,
    userId: user.id,
    sanitizedAnswers,
    orgKeyMapping,
  })

  if (assignmentRow.complete_on_submit) {
    await processModuleCompletion({
      supabase,
      moduleId,
      userId: user.id,
      moduleMeta,
      modulePath,
    })
  }

  await revalidateClassViews({
    classId: moduleMeta.class_id,
    classSlug: slug,
    additionalTargets: modulePath ? [modulePath] : undefined,
  })

  return NextResponse.json({
    status: submissionRows?.status ?? desiredStatus,
    answers: submissionRows?.answers ?? sanitizedAnswers,
    updatedAt: submissionRows?.updated_at ?? null,
    completeOnSubmit: Boolean(assignmentRow.complete_on_submit),
  })
}
