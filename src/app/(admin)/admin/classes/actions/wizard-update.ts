"use server"

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
import { requireAdmin } from "@/lib/admin/auth"

import { ensureUniqueClassSlug, isRlsError, slugify } from "./utils"
import { revalidateClassViews } from "./revalidate"

export async function updateClassWizardAction(classId: string, payloadRaw: string) {
  return await updateClassFromLessonWizardPayload(classId, payloadRaw)
}

async function updateClassFromLessonWizardPayload(classId: string, payloadRaw: string) {
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

  const rawModules: Array<Record<string, unknown>> = Array.isArray(payload.modules)
    ? (payload.modules as Array<Record<string, unknown>>)
    : []
  const modules = rawModules.filter(
    (module): module is { moduleId: string } & Record<string, unknown> => {
      const id = (module as { moduleId?: unknown }).moduleId
      return typeof id === "string" && id.trim().length > 0
    },
  )

  await requireAdmin()
  const supabase = await createSupabaseServerClient()
  const admin = createSupabaseAdminClient()

  type ClassRow = { id: string; slug: string | null }
  const fetchResult = await supabase
    .from("classes" satisfies keyof Database["public"]["Tables"]) 
    .select("id, slug")
    .eq("id", classId)
    .maybeSingle<ClassRow>()
  let existingClass: ClassRow | null = fetchResult.data ?? null
  const classFetchError = fetchResult.error
  if (classFetchError) {
    const { data: adminClass, error: adminFetchError } = await admin
      .from("classes" satisfies keyof Database["public"]["Tables"]) 
      .select("id, slug")
      .eq("id", classId)
      .maybeSingle<ClassRow>()
    if (adminFetchError) return { error: adminFetchError.message }
    existingClass = adminClass ?? null
  }
  if (!existingClass) {
    const { data: adminClass } = await admin
      .from("classes" satisfies keyof Database["public"]["Tables"]) 
      .select("id, slug")
      .eq("id", classId)
      .maybeSingle<ClassRow>()
    if (!adminClass) return { error: "Class not found" }
    existingClass = adminClass
  }

  const trimmedSubtitle = typeof payload.subtitle === "string" ? payload.subtitle.trim() : ""
  const normalizedSubtitle = clampText(trimmedSubtitle, LESSON_SUBTITLE_MAX_LENGTH)

  const originalSlug = existingClass.slug ?? null
  const slugBase = slugify(normalizedTitle)
  const nextSlug = slugBase.length > 0 ? await ensureUniqueClassSlug(supabase, slugBase, classId) : originalSlug ?? `class-${classId.slice(0, 8)}`
  const description = htmlToMarkdown(payload.body ?? "")

  const classUpdatePayload: Database["public"]["Tables"]["classes"]["Update"] & Record<string, unknown> = {
    title: normalizedTitle,
    description,
    subtitle: normalizedSubtitle || null,
    video_url: typeof payload.videoUrl === "string" && payload.videoUrl.trim().length > 0 ? payload.videoUrl.trim() : null,
    link1_title: (payload.links?.[0]?.title ?? "").trim() || null,
    link1_url: (payload.links?.[0]?.url ?? "").trim() || null,
    link2_title: (payload.links?.[1]?.title ?? "").trim() || null,
    link2_url: (payload.links?.[1]?.url ?? "").trim() || null,
    link3_title: (payload.links?.[2]?.title ?? "").trim() || null,
    link3_url: (payload.links?.[2]?.url ?? "").trim() || null,
  }
  if (nextSlug) classUpdatePayload.slug = nextSlug

  let { data: updatedClassRow, error: classUpdateError } = await supabase
    .from("classes" satisfies keyof Database["public"]["Tables"]) 
    .update(classUpdatePayload)
    .eq("id", classId)
    .select("id")
    .maybeSingle<{ id: string }>()

  if (classUpdateError || !updatedClassRow) {
    const res = await admin
      .from("classes" satisfies keyof Database["public"]["Tables"]) 
      .update(classUpdatePayload)
      .eq("id", classId)
      .select("id")
      .maybeSingle<{ id: string }>()
    classUpdateError = res.error as typeof classUpdateError
    updatedClassRow = res.data as typeof updatedClassRow
  }
  if (classUpdateError || !updatedClassRow) return { error: classUpdateError?.message ?? "Failed to update class" }

  const { data: moduleRows, error: moduleFetchError } = await supabase
    .from("modules" satisfies keyof Database["public"]["Tables"]) 
    .select("id, idx, title, slug")
    .eq("class_id", classId)
    .returns<Array<{ id: string; idx: number; title: string | null; slug: string | null }>>()
  if (moduleFetchError) return { error: moduleFetchError.message }

  const existingModuleMap = new Map<string, { idx: number; title: string | null; slug: string | null }>()
  for (const row of moduleRows ?? []) {
    existingModuleMap.set(row.id, { idx: row.idx, title: row.title ?? null, slug: row.slug ?? null })
  }

  const moduleContentRows: Database["public"]["Tables"]["module_content"]["Insert"][] = []
  const assignmentUpserts: Database["public"]["Tables"]["module_assignments"]["Insert"][] = []
  const modulesWithoutAssignments: string[] = []
  const moduleRevalidateTargets: string[] = []

  try {
    for (let index = 0; index < modules.length; index += 1) {
      const modulePayload = modules[index]
      const moduleId = modulePayload.moduleId
      const existing = existingModuleMap.get(moduleId)
      if (!existing) continue

      const rawModuleTitle = typeof modulePayload.title === "string" ? modulePayload.title.trim() : ""
      const normalizedModuleTitle = clampText(rawModuleTitle.length > 0 ? rawModuleTitle : existing.title ?? `Module ${existing.idx}`, MODULE_TITLE_MAX_LENGTH)

      const rawModuleSubtitle = typeof modulePayload.subtitle === "string" ? modulePayload.subtitle.trim() : ""
      const normalizedModuleSubtitle = rawModuleSubtitle.length > 0 ? clampText(rawModuleSubtitle, MODULE_SUBTITLE_MAX_LENGTH) : null

      const moduleBody = typeof modulePayload.body === "string" ? modulePayload.body : ""
      const markdown = htmlToMarkdown(moduleBody)
      const videoUrl = typeof modulePayload.videoUrl === "string" && modulePayload.videoUrl.trim().length > 0 ? modulePayload.videoUrl.trim() : null

      const moduleUpdate: Database["public"]["Tables"]["modules"]["Update"] = {
        title: normalizedModuleTitle,
        description: normalizedModuleSubtitle,
        content_md: markdown.length > 0 ? markdown : null,
        video_url: videoUrl,
        idx: index + 1,
      }

      let { data: updatedModuleRow, error: moduleUpdateError } = await supabase
        .from("modules" satisfies keyof Database["public"]["Tables"]) 
        .update(moduleUpdate)
        .eq("id", moduleId)
        .select("id")
        .maybeSingle<{ id: string }>()
      if (moduleUpdateError || !updatedModuleRow) {
        const res = await admin
          .from("modules" satisfies keyof Database["public"]["Tables"]) 
          .update(moduleUpdate)
          .eq("id", moduleId)
          .select("id")
          .maybeSingle<{ id: string }>()
        moduleUpdateError = res.error as typeof moduleUpdateError
        updatedModuleRow = res.data as typeof updatedModuleRow
      }
      if (moduleUpdateError || !updatedModuleRow) throw new Error(moduleUpdateError?.message ?? "Failed to update module")

      const moduleResources = Array.isArray(modulePayload?.resources)
        ? (modulePayload.resources as SharedLessonWizardPayload["modules"][number]["resources"])
        : []
      const lessonLinks = Array.isArray(payload.links) ? payload.links : []
      const resources = buildResourcePayload(moduleResources, index === 0 ? lessonLinks : [])
      const hasResources = resources.length > 0
      const hasVideo = typeof videoUrl === "string" && videoUrl.length > 0
      if (hasResources || hasVideo) {
        const contentRow: Database["public"]["Tables"]["module_content"]["Insert"] = { module_id: moduleId }
        if (hasVideo) contentRow.video_url = videoUrl
        if (hasResources) contentRow.resources = resources as Database["public"]["Tables"]["module_content"]["Insert"]["resources"]
        moduleContentRows.push(contentRow)
      }

      const moduleFormFields = Array.isArray(modulePayload?.formFields)
        ? (modulePayload.formFields as SharedLessonWizardPayload["modules"][number]["formFields"])
        : []
      const assignmentSchema = buildAssignmentSchema(moduleFormFields)
      if (assignmentSchema) {
        assignmentUpserts.push({
          module_id: moduleId,
          schema: assignmentSchema as Database["public"]["Tables"]["module_assignments"]["Insert"]["schema"],
          complete_on_submit: true,
        })
      } else {
        modulesWithoutAssignments.push(moduleId)
      }

      moduleRevalidateTargets.push(`/training/module/${moduleId}`)
    }

    if (moduleContentRows.length > 0) {
      let contentResult = await supabase
        .from("module_content" satisfies keyof Database["public"]["Tables"]) 
        .upsert(moduleContentRows, { onConflict: "module_id" })
      if (contentResult.error && isRlsError(contentResult.error)) {
        contentResult = await admin
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
        assignmentResult = await admin
          .from("module_assignments" satisfies keyof Database["public"]["Tables"]) 
          .upsert(assignmentUpserts, { onConflict: "module_id" })
      }
      if (assignmentResult.error) throw new Error(assignmentResult.error.message)
    }

    for (const moduleId of modulesWithoutAssignments) {
      let deleteResult = await supabase
        .from("module_assignments" satisfies keyof Database["public"]["Tables"]) 
        .delete()
        .eq("module_id", moduleId)
      if (deleteResult.error && isRlsError(deleteResult.error)) {
        deleteResult = await admin
          .from("module_assignments" satisfies keyof Database["public"]["Tables"]) 
          .delete()
          .eq("module_id", moduleId)
      }
      if (deleteResult.error) throw new Error(deleteResult.error.message)
    }

  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update lesson" }
  }

  revalidateClassViews({ classId, classSlug: nextSlug, additionalTargets: moduleRevalidateTargets })
  return { id: classId }
}
