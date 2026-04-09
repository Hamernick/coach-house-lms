import { notFound } from "next/navigation"

import type { SupabaseClient } from "@supabase/supabase-js"

import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import type { Database } from "@/lib/supabase"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { supabaseErrorToError } from "@/lib/supabase/errors"

import { parseAssignmentFields, parseLegacyHomework } from "./assignment"
import {
  buildClassResourcesAndVideo,
  inferResourceProvider,
  resolveClassPublished,
  resolveClassSubtitle,
  type ClassWithLightModules,
  type ClassWithModules,
} from "./service-helpers"
import type {
  ClassModulePageResult,
  ModuleAssignment,
  ModuleAssignmentSubmission,
  ModuleProgressStatus,
  ModuleRecord,
  ModuleResource,
} from "./types"

function isMissingModuleRelationError(error: { code?: string } | null | undefined) {
  const code = error?.code
  return code === "42P01" || code === "42703"
}

function normalizeModuleSubmissionStatus(
  rawStatus: string | null | undefined,
): ModuleAssignmentSubmission["status"] {
  return rawStatus === "accepted" || rawStatus === "revise" ? rawStatus : "submitted"
}

function mapModuleResources(resourcesValue: unknown): ModuleResource[] {
  const rawResources = Array.isArray(resourcesValue)
    ? (resourcesValue as Array<Record<string, unknown>>)
    : []

  return rawResources
    .map((resource) => {
      if (!resource || typeof resource !== "object") return null
      const r = resource as { label?: unknown; url?: unknown }
      const label = typeof r.label === "string" ? r.label.trim() : ""
      const url = typeof r.url === "string" ? r.url.trim() : ""
      if (!label && !url) return null
      return {
        label: label || url,
        url,
        provider: inferResourceProvider(url),
      }
    })
    .filter((value): value is ModuleResource => Boolean(value))
}

export async function getClassModulePageForUser({
  classSlug,
  moduleIndex,
  userId,
  forceAdmin = false,
  supabase: supabaseOverride,
}: {
  classSlug: string
  moduleIndex: number
  userId: string
  forceAdmin?: boolean
  supabase?: SupabaseClient<Database, "public">
}): Promise<ClassModulePageResult> {
  const supabase = supabaseOverride ?? await createSupabaseServerClient()
  const elevated = forceAdmin ? createSupabaseAdminClient() : null
  const primary = elevated ?? supabase

  let classRow: unknown | null = null
  {
    const { data, error } = await primary
      .from("classes" satisfies keyof Database["public"]["Tables"])
      .select(
        `id, title, description, subtitle, video_url, link1_title, link1_url, link2_title, link2_url, link3_title, link3_url, is_published, modules ( id, idx, slug, title, description, is_published, video_url, duration_minutes, deck_path )`,
      )
      .eq("slug", classSlug)
      .maybeSingle()

    if (error) {
      if ((error as { code?: string }).code === "42703") {
        const { data: fallback, error: err2 } = await primary
          .from("classes" satisfies keyof Database["public"]["Tables"])
          .select(
            `id, title, description, published, modules ( id, idx, slug, title, description, published )`,
          )
          .eq("slug", classSlug)
          .maybeSingle()
        if (err2) throw supabaseErrorToError(err2, "Unable to load class.")
        classRow = fallback
      } else {
        throw supabaseErrorToError(error, "Unable to load class.")
      }
    } else {
      classRow = data
    }
  }

  if (!classRow) {
    try {
      const elevatedClient = elevated ?? createSupabaseAdminClient()
      const { data: adminData } = await elevatedClient
        .from("classes" satisfies keyof Database["public"]["Tables"])
        .select(
          `id, title, description, subtitle, video_url, link1_title, link1_url, link2_title, link2_url, link3_title, link3_url, is_published, modules ( id, idx, slug, title, description, is_published, video_url, duration_minutes, deck_path )`,
        )
        .eq("slug", classSlug)
        .maybeSingle()
      classRow = adminData
    } catch {
      // Ignore; will 404 below if still null.
    }
  }

  if (!classRow) {
    notFound()
  }

  const classRecord = classRow as ClassWithLightModules
  const { classVideoUrl, classResources } = buildClassResourcesAndVideo(
    classRecord as ClassWithModules,
  )
  const classSubtitle = resolveClassSubtitle(classRecord as ClassWithModules)
  const classPublished = resolveClassPublished(classRecord as ClassWithModules)

  const allModuleRows = [...(classRecord.modules ?? [])].sort(
    (a, b) => ((a?.idx ?? 0) - (b?.idx ?? 0)),
  )

  if (allModuleRows.length === 0) {
    return {
      classId: classRecord.id,
      classTitle: classRecord.title,
      classDescription: classRecord.description ?? null,
      classSubtitle,
      classVideoUrl,
      classResources,
      classPublished,
      modules: [],
      progressMap: {},
      currentModuleId: null,
    }
  }

  const allModuleRecords: ModuleRecord[] = allModuleRows.map((module, index) => ({
    id: module.id,
    idx:
      typeof module.idx === "number" && Number.isFinite(module.idx) ? module.idx : index + 1,
    slug: module.slug,
    title: module.title,
    description: module.description ?? null,
    videoUrl: (module as { video_url?: string | null }).video_url ?? null,
    contentMd: null,
    durationMinutes: (module as { duration_minutes?: number | null }).duration_minutes ?? null,
    published:
      "is_published" in module
        ? Boolean((module as { is_published?: boolean | null }).is_published)
        : Boolean((module as { published?: boolean | null }).published ?? true),
    hasDeck: Boolean((module as { deck_path?: string | null }).deck_path ?? null),
    resources: [],
    assignment: null,
    assignmentSubmission: null,
  }))

  const modules = forceAdmin
    ? allModuleRecords
    : allModuleRecords.filter((module) => module.published)

  if (modules.length === 0) {
    return {
      classId: classRecord.id,
      classTitle: classRecord.title,
      classDescription: classRecord.description ?? null,
      classSubtitle,
      classVideoUrl,
      classResources,
      classPublished,
      modules: [],
      progressMap: {},
      currentModuleId: null,
    }
  }

  const currentModuleBase = modules.find((module) => module.idx === moduleIndex)
  if (!currentModuleBase) {
    notFound()
  }

  const moduleIds = modules.map((module) => module.id)

  const [
    progressResult,
    assignmentMetaResult,
    submissionStatusResult,
    currentContentResult,
    currentAssignmentResult,
    currentSubmissionResult,
    currentModuleContentResult,
  ] = await Promise.all([
    supabase
      .from("module_progress" satisfies keyof Database["public"]["Tables"])
      .select("module_id, status")
      .eq("user_id", userId)
      .in("module_id", moduleIds)
      .returns<Array<{ module_id: string; status: string }>>(),
    primary
      .from("module_assignments" satisfies keyof Database["public"]["Tables"])
      .select("module_id, complete_on_submit")
      .in("module_id", moduleIds)
      .returns<Array<{ module_id: string; complete_on_submit: boolean | null }>>(),
    supabase
      .from("assignment_submissions" satisfies keyof Database["public"]["Tables"])
      .select("module_id, status")
      .eq("user_id", userId)
      .in("module_id", moduleIds)
      .returns<Array<{ module_id: string; status: string | null }>>(),
    primary
      .from("module_content" satisfies keyof Database["public"]["Tables"])
      .select("module_id, video_url, resources, homework")
      .eq("module_id", currentModuleBase.id)
      .maybeSingle<{
        module_id: string
        video_url: string | null
        resources: unknown
        homework: unknown
      }>(),
    primary
      .from("module_assignments" satisfies keyof Database["public"]["Tables"])
      .select("module_id, schema, complete_on_submit")
      .eq("module_id", currentModuleBase.id)
      .maybeSingle<{
        module_id: string
        schema: unknown
        complete_on_submit: boolean | null
      }>(),
    supabase
      .from("assignment_submissions" satisfies keyof Database["public"]["Tables"])
      .select("module_id, answers, status, updated_at")
      .eq("user_id", userId)
      .eq("module_id", currentModuleBase.id)
      .maybeSingle<{
        module_id: string
        answers: unknown
        status: string | null
        updated_at: string | null
      }>(),
    primary
      .from("modules" satisfies keyof Database["public"]["Tables"])
      .select("id, content_md")
      .eq("id", currentModuleBase.id)
      .maybeSingle<{ id: string; content_md: string | null }>(),
  ])

  if (progressResult.error && !isMissingModuleRelationError(progressResult.error)) {
    throw supabaseErrorToError(progressResult.error, "Unable to load module progress.")
  }
  if (assignmentMetaResult.error && !isMissingModuleRelationError(assignmentMetaResult.error)) {
    throw supabaseErrorToError(
      assignmentMetaResult.error,
      "Unable to load module assignment.",
    )
  }
  if (submissionStatusResult.error && !isMissingModuleRelationError(submissionStatusResult.error)) {
    throw supabaseErrorToError(
      submissionStatusResult.error,
      "Unable to load assignment submission.",
    )
  }
  if (currentContentResult.error && !isMissingModuleRelationError(currentContentResult.error)) {
    throw supabaseErrorToError(currentContentResult.error, "Unable to load module content.")
  }
  if (currentAssignmentResult.error && !isMissingModuleRelationError(currentAssignmentResult.error)) {
    throw supabaseErrorToError(
      currentAssignmentResult.error,
      "Unable to load module assignment.",
    )
  }
  if (currentSubmissionResult.error && !isMissingModuleRelationError(currentSubmissionResult.error)) {
    throw supabaseErrorToError(
      currentSubmissionResult.error,
      "Unable to load assignment submission.",
    )
  }
  if (
    currentModuleContentResult.error &&
    !isMissingModuleRelationError(currentModuleContentResult.error)
  ) {
    throw supabaseErrorToError(
      currentModuleContentResult.error,
      "Unable to load module content.",
    )
  }

  const progressStatusByModuleId = new Map<string, ModuleProgressStatus>()
  for (const row of progressResult.data ?? []) {
    progressStatusByModuleId.set(row.module_id, row.status as ModuleProgressStatus)
  }

  const assignmentCompleteOnSubmitByModuleId = new Map<string, boolean>()
  for (const row of assignmentMetaResult.data ?? []) {
    if (!row?.module_id) continue
    assignmentCompleteOnSubmitByModuleId.set(
      row.module_id,
      Boolean(row.complete_on_submit),
    )
  }

  const submissionStatusByModuleId = new Map<
    string,
    ModuleAssignmentSubmission["status"]
  >()
  for (const row of submissionStatusResult.data ?? []) {
    if (!row?.module_id) continue
    submissionStatusByModuleId.set(
      row.module_id,
      normalizeModuleSubmissionStatus(row.status),
    )
  }

  const progressMap: Record<string, ModuleProgressStatus> = {}
  for (const moduleRecord of modules) {
    const progressStatus = progressStatusByModuleId.get(moduleRecord.id)
    if (progressStatus && progressStatus !== "not_started") {
      progressMap[moduleRecord.id] = progressStatus
      continue
    }

    const submissionStatus = submissionStatusByModuleId.get(moduleRecord.id)
    if (!submissionStatus) continue

    const completeOnSubmit = Boolean(
      assignmentCompleteOnSubmitByModuleId.get(moduleRecord.id),
    )
    progressMap[moduleRecord.id] =
      completeOnSubmit && submissionStatus !== "revise"
        ? "completed"
        : "in_progress"
  }

  const currentContentRow = currentContentResult.data
  const currentAssignmentRow = currentAssignmentResult.data
  const currentSubmissionRow = currentSubmissionResult.data
  const currentContentMd = currentModuleContentResult.data?.content_md ?? null
  const currentLegacyAssignment = parseLegacyHomework(currentContentRow?.homework)
  const currentAssignmentFields = parseAssignmentFields(currentAssignmentRow?.schema)

  const currentAssignment: ModuleAssignment | null =
    currentAssignmentFields.length > 0
      ? {
          fields: currentAssignmentFields,
          completeOnSubmit: Boolean(currentAssignmentRow?.complete_on_submit),
        }
      : currentLegacyAssignment.length > 0
        ? {
            fields: currentLegacyAssignment,
            completeOnSubmit: false,
          }
        : null

  const currentSubmission: ModuleAssignmentSubmission | null = currentSubmissionRow
    ? {
        answers:
          currentSubmissionRow.answers &&
          typeof currentSubmissionRow.answers === "object" &&
          !Array.isArray(currentSubmissionRow.answers)
            ? (currentSubmissionRow.answers as Record<string, unknown>)
            : {},
        status: normalizeModuleSubmissionStatus(currentSubmissionRow.status),
        updatedAt: currentSubmissionRow.updated_at ?? null,
      }
    : null

  const currentModule = {
    ...currentModuleBase,
    videoUrl: currentModuleBase.videoUrl ?? currentContentRow?.video_url ?? null,
    contentMd: currentContentMd,
    resources: mapModuleResources(currentContentRow?.resources),
    assignment: currentAssignment,
    assignmentSubmission: currentSubmission,
  }

  return {
    classId: classRecord.id,
    classTitle: classRecord.title,
    classDescription: classRecord.description ?? null,
    classSubtitle,
    classVideoUrl,
    classResources,
    classPublished,
    modules: modules.map((module) =>
      module.id === currentModule.id ? currentModule : module,
    ),
    progressMap,
    currentModuleId: currentModule.id,
  }
}
