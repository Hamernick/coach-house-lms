"use server"

import type { PostgrestError } from "@supabase/supabase-js"

import { requireAdmin } from "@/lib/admin/auth"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase"
import {
  LESSON_SUBTITLE_MAX_LENGTH,
  LESSON_TITLE_MAX_LENGTH,
  MODULE_SUBTITLE_MAX_LENGTH,
  MODULE_TITLE_MAX_LENGTH,
  clampText,
} from "@/lib/lessons/limits"
import { htmlToMarkdown } from "@/lib/markdown/convert"
import { validateFinalPayload } from "@/lib/lessons/schemas"
import type { LessonWizardPayload as SharedLessonWizardPayload } from "@/lib/lessons/types"
import { buildAssignmentSchema, buildResourcePayload } from "@/lib/lessons/builders"

import { ensureUniqueClassSlug, isRlsError, slugify, safeDeleteClass, randomId } from "./utils"
import { revalidateClassViews } from "./revalidate"

export async function createClassWizardAction(formData: FormData) {
  const payloadRaw = formData.get("payload")
  if (typeof payloadRaw === "string") {
    return await createClassFromLessonWizardPayload(payloadRaw)
  }

  const title = formData.get("title")
  const slug = formData.get("slug")
  const description = formData.get("description")
  const isPublished = formData.get("published") === "true"
  const sessionNumber = formData.get("sessionNumber")
  const initialModules = formData.get("initialModules")

  if (typeof title !== "string" || typeof slug !== "string") {
    return { error: "Missing title or slug" }
  }

  await requireAdmin()
  const supabase = await createSupabaseServerClient()

  const { data: rows } = await supabase
    .from("classes" satisfies keyof Database["public"]["Tables"]) 
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
  const nextPos = ((rows?.[0] as { position?: number } | undefined)?.position ?? 0) + 1

  const insertPayloadBase = {
    title: title.trim(),
    slug: slug.trim(),
    description: typeof description === "string" ? description : null,
    is_published: isPublished,
    position: nextPos,
    ...(typeof sessionNumber === "string" && sessionNumber ? { session_number: Number.parseInt(sessionNumber, 10) } : {}),
  }
  const insertPayload = insertPayloadBase as unknown as Database["public"]["Tables"]["classes"]["Insert"]

  let created: { id: string } | null = null
  let error: PostgrestError | null = null

  {
    const response = await supabase
    .from("classes" satisfies keyof Database["public"]["Tables"]) 
    .insert(insertPayload)
    .select("id")
    .single<{ id: string }>()
    created = response.data
    error = response.error
  }

  if (error && isRlsError(error)) {
    const admin = createSupabaseAdminClient()
    const response = await admin
      .from("classes" satisfies keyof Database["public"]["Tables"]) 
      .insert(insertPayload)
      .select("id")
      .single<{ id: string }>()
    created = response.data
    error = response.error
  }

  if (error) return { error: error.message }
  if (!created?.id) return { error: "Failed to create class" }
  const classId = created.id

  const modulesCount = typeof initialModules === "string" && initialModules ? Math.max(0, Math.min(10, Number.parseInt(initialModules, 10))) : 0
  if (modulesCount > 0) {
    const inserts: Database["public"]["Tables"]["modules"]["Insert"][] = []
    for (let i = 1; i <= modulesCount; i++) {
      inserts.push({ class_id: classId, idx: i, slug: `m${i}`, title: `Module ${i}`, is_published: false })
    }
    let { error: mErr } = await supabase
      .from("modules" satisfies keyof Database["public"]["Tables"]) 
      .insert(inserts)
    if (mErr && isRlsError(mErr)) {
      const admin = createSupabaseAdminClient()
      const res = await admin
        .from("modules" satisfies keyof Database["public"]["Tables"]) 
        .insert(inserts)
      mErr = res.error as typeof mErr
    }
    if (mErr) return { error: mErr.message, id: classId }
  }

  revalidateClassViews({ classId })
  return { id: classId }
}

async function createClassFromLessonWizardPayload(payloadRaw: string) {
  let parsed: unknown
  try {
    parsed = JSON.parse(payloadRaw)
  } catch {
    return { error: "Invalid lesson payload" }
  }

  let payload: SharedLessonWizardPayload
  try {
    payload = validateFinalPayload(parsed as SharedLessonWizardPayload)
  } catch {
    return { error: "Invalid lesson payload" }
  }

  const trimmedTitle = typeof payload.title === "string" ? payload.title.trim() : ""
  const normalizedTitle = clampText(trimmedTitle, LESSON_TITLE_MAX_LENGTH)
  if (normalizedTitle.length === 0) return { error: "Lesson title is required" }

  const modules = Array.isArray(payload.modules) ? payload.modules : []
  if (modules.length === 0) return { error: "Add at least one module before creating the lesson" }

  const trimmedSubtitle = typeof payload.subtitle === "string" ? payload.subtitle.trim() : ""
  const normalizedSubtitle = clampText(trimmedSubtitle, LESSON_SUBTITLE_MAX_LENGTH)

  await requireAdmin()
  const supabase = await createSupabaseServerClient()
  const admin = createSupabaseAdminClient()

  const slugBase = slugify(normalizedTitle)
  let slugCandidate = slugBase.length > 0 ? slugBase : `class-${randomId().slice(0, 8)}`
  if (slugBase.length > 0) slugCandidate = await ensureUniqueClassSlug(supabase, slugBase)

  const { data: rows } = await supabase
    .from("classes" satisfies keyof Database["public"]["Tables"]) 
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
  const nextPos = ((rows?.[0] as { position?: number } | undefined)?.position ?? 0) + 1

  const description = htmlToMarkdown(payload.body ?? "")

  const classInsertBase = {
    title: normalizedTitle,
    slug: slugCandidate,
    description,
    subtitle: normalizedSubtitle || null,
    video_url: typeof payload.videoUrl === "string" && payload.videoUrl.trim().length > 0 ? payload.videoUrl.trim() : null,
    link1_title: (payload.links?.[0]?.title ?? "").trim() || null,
    link1_url: (payload.links?.[0]?.url ?? "").trim() || null,
    link2_title: (payload.links?.[1]?.title ?? "").trim() || null,
    link2_url: (payload.links?.[1]?.url ?? "").trim() || null,
    link3_title: (payload.links?.[2]?.title ?? "").trim() || null,
    link3_url: (payload.links?.[2]?.url ?? "").trim() || null,
    is_published: false,
    position: nextPos,
  }
  const classInsert = classInsertBase as unknown as Database["public"]["Tables"]["classes"]["Insert"]

  let created: { id: string } | null = null
  let error: PostgrestError | null = null

  {
    const response = await supabase
      .from("classes" satisfies keyof Database["public"]["Tables"])
      .insert(classInsert)
      .select("id")
      .single<{ id: string }>()
    created = response.data
    error = response.error
  }

  if (error) {
    const response = await admin
      .from("classes" satisfies keyof Database["public"]["Tables"]) 
      .insert(classInsert)
      .select("id")
      .single<{ id: string }>()
    created = response.data
    error = response.error
  }
  if (error || !created) return { error: error?.message ?? "Failed to create lesson" }

  const classId = created.id

  try {
    const moduleInserts: Database["public"]["Tables"]["modules"]["Insert"][] = modules.map((module, index) => {
      const rawModuleTitle = typeof module?.title === "string" ? module.title.trim() : ""
      const normalizedModuleTitle = clampText(rawModuleTitle.length > 0 ? rawModuleTitle : `Module ${index + 1}`, MODULE_TITLE_MAX_LENGTH)
      const moduleSlug = `${(slugify(normalizedModuleTitle) || "module")}-${randomId().slice(0, 6)}`
      const contentMarkdown = htmlToMarkdown(module?.body ?? "")

      const rawModuleSubtitle = typeof module?.subtitle === "string" ? module.subtitle.trim() : ""
      const normalizedModuleSubtitle = rawModuleSubtitle.length > 0 ? clampText(rawModuleSubtitle, MODULE_SUBTITLE_MAX_LENGTH) : null

      return {
        class_id: classId,
        idx: index + 1,
        slug: moduleSlug,
        title: normalizedModuleTitle,
        description: normalizedModuleSubtitle,
        video_url: typeof module?.videoUrl === "string" && module.videoUrl.trim().length > 0 ? module.videoUrl.trim() : null,
        content_md: contentMarkdown.length > 0 ? contentMarkdown : null,
        is_published: false,
      }
    })

    let insertedModules: Array<{ id: string; idx: number }> | null = null
    let moduleError: PostgrestError | null = null

    {
      const response = await supabase
        .from("modules" satisfies keyof Database["public"]["Tables"])
        .insert(moduleInserts)
        .select("id, idx")
        .returns<Array<{ id: string; idx: number }>>()
      insertedModules = response.data
      moduleError = response.error
    }

    if (moduleError && isRlsError(moduleError)) {
      const response = await admin
        .from("modules" satisfies keyof Database["public"]["Tables"])
        .insert(moduleInserts)
        .select("id, idx")
        .returns<Array<{ id: string; idx: number }>>()
      insertedModules = response.data
      moduleError = response.error
    }
    if (moduleError || !insertedModules) throw new Error(moduleError?.message ?? "Failed to create modules")

    const moduleIdByIndex = new Map<number, string>()
    for (const row of insertedModules) {
      moduleIdByIndex.set(row.idx, row.id)
    }

    const moduleContentRows: Database["public"]["Tables"]["module_content"]["Insert"][] = []
    const assignmentUpserts: Database["public"]["Tables"]["module_assignments"]["Insert"][] = []

    modules.forEach((module, moduleIndex) => {
      const idx = moduleIndex + 1
      const moduleId = moduleIdByIndex.get(idx)
      if (!moduleId) return

      const resources = buildResourcePayload(module?.resources ?? [], moduleIndex === 0 ? payload.links ?? [] : [])
      const videoUrl = typeof module?.videoUrl === "string" && module.videoUrl.trim().length > 0 ? module.videoUrl.trim() : null

      if (resources.length > 0 || videoUrl) {
        const contentRow: Database["public"]["Tables"]["module_content"]["Insert"] = { module_id: moduleId }
        if (videoUrl) contentRow.video_url = videoUrl
        if (resources.length > 0) contentRow.resources = resources as Database["public"]["Tables"]["module_content"]["Insert"]["resources"]
        moduleContentRows.push(contentRow)
      }

      const assignmentSchema = buildAssignmentSchema(module?.formFields ?? [])
      if (assignmentSchema) {
        assignmentUpserts.push({
          module_id: moduleId,
          schema: assignmentSchema as Database["public"]["Tables"]["module_assignments"]["Insert"]["schema"],
          complete_on_submit: true,
        })
      }
    })

    if (moduleContentRows.length > 0) {
      let contentResult = await supabase
        .from("module_content" satisfies keyof Database["public"]["Tables"]) 
        .upsert(moduleContentRows, { onConflict: "module_id" })
      if (contentResult.error && isRlsError(contentResult.error)) {
        contentResult = await createSupabaseAdminClient()
          .from("module_content" satisfies keyof Database["public"]["Tables"]) 
          .upsert(moduleContentRows, { onConflict: "module_id" })
      }
      if (contentResult.error) throw new Error(contentResult.error.message)
    }

    if (assignmentUpserts.length > 0) {
      let assignmentResult = await supabase
        .from("module_assignments" satisfies keyof Database["public"]["Tables"]) 
        .upsert(assignmentUpserts, { onConflict: "module_id" })
      if (assignmentResult.error && isRlsError(assignmentResult.error)) {
        assignmentResult = await createSupabaseAdminClient()
          .from("module_assignments" satisfies keyof Database["public"]["Tables"]) 
          .upsert(assignmentUpserts, { onConflict: "module_id" })
      }
      if (assignmentResult.error) throw new Error(assignmentResult.error.message)
    }
  } catch (err) {
    await safeDeleteClass(classId, supabase, admin)
    return { error: err instanceof Error ? err.message : "Failed to create lesson" }
  }

  revalidateClassViews({ classId, classSlug: slugCandidate })
  return { id: classId }
}
