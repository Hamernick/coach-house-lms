import { NextResponse } from "next/server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { generateHomeworkSuggestion } from "@/lib/homework/assist"
import { resolveActiveOrganization } from "@/lib/organization/active-org"

type AssistRequestBody = {
  moduleId?: string
  fieldName?: string
  fieldLabel?: string
  promptContext?: string
  classTitle?: string
  moduleTitle?: string
  currentAnswer?: string
}

export async function POST(request: Request) {
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

  const { orgId } = await resolveActiveOrganization(supabase, user.id)

  let body: AssistRequestBody
  try {
    body = (await request.json()) as AssistRequestBody
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (!body?.moduleId || !body.fieldName) {
    return NextResponse.json({ error: "Missing moduleId or fieldName" }, { status: 400 })
  }

  const { data: moduleRow, error: moduleError } = await supabase
    .from("modules")
    .select("id, title, idx, class_id, classes ( id, title, slug )")
    .eq("id", body.moduleId)
    .maybeSingle<{
      id: string
      title: string | null
      idx: number | null
      class_id: string
      classes: { id: string; title: string | null; slug: string | null } | null
    }>()

  if (moduleError) {
    return NextResponse.json({ error: moduleError.message }, { status: 500 })
  }

  if (!moduleRow) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 })
  }

  const { data: orgRow, error: orgError } = await supabase
    .from("organizations")
    .select("profile")
    .eq("user_id", orgId)
    .maybeSingle<{ profile: Record<string, unknown> | null }>()

  if (orgError) {
    return NextResponse.json({ error: orgError.message }, { status: 500 })
  }

  const suggestion = await generateHomeworkSuggestion({
    fieldLabel: body.fieldLabel ?? body.fieldName,
    promptContext: body.promptContext ?? body.fieldName,
    classTitle: body.classTitle ?? moduleRow.classes?.title ?? undefined,
    moduleTitle: body.moduleTitle ?? moduleRow.title ?? undefined,
    currentAnswer: body.currentAnswer ?? "",
    orgProfile: orgRow?.profile ?? {},
  })

  return NextResponse.json({ suggestion })
}
