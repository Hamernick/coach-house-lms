import { notFound } from "next/navigation"

import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase"
import { inferProviderSlug } from "@/lib/lessons/providers"
import { toNumberOrNull, normalizeFormFieldTypeLegacy } from "@/lib/lessons/fields"

export type ModuleResourceProvider =
  | "youtube"
  | "google-drive"
  | "dropbox"
  | "loom"
  | "vimeo"
  | "notion"
  | "figma"
  | "generic"

export type ModuleResource = {
  label: string
  url: string
  provider: ModuleResourceProvider
}

export type ModuleAssignmentField = {
  name: string
  label: string
  type: "short_text" | "long_text" | "select" | "multi_select" | "slider" | "subtitle" | "custom_program"
  required: boolean
  placeholder?: string
  description?: string
  options?: string[]
  min?: number | null
  max?: number | null
  step?: number | null
  programTemplate?: string
}

export type ModuleAssignment = {
  fields: ModuleAssignmentField[]
  completeOnSubmit: boolean
}

export type ModuleAssignmentSubmission = {
  answers: Record<string, unknown>
  status: "submitted" | "accepted" | "revise"
  updatedAt: string | null
}

export type ModuleRecord = {
  id: string
  idx: number
  slug: string
  title: string
  description: string | null
  videoUrl: string | null
  contentMd: string | null
  durationMinutes: number | null
  published: boolean
  hasDeck: boolean
  resources: ModuleResource[]
  assignment: ModuleAssignment | null
  assignmentSubmission: ModuleAssignmentSubmission | null
}

export type ModuleProgressStatus = "not_started" | "in_progress" | "completed"

type ClassModuleResult = {
  classId: string
  classTitle: string
  classDescription: string | null
  classSubtitle?: string | null
  classPublished: boolean
  modules: ModuleRecord[]
  progressMap: Record<string, ModuleProgressStatus>
}

type ClassWithModules = Database["public"]["Tables"]["classes"]["Row"] & {
  modules: Array<
    Pick<
      Database["public"]["Tables"]["modules"]["Row"],
      | "id"
      | "idx"
      | "slug"
      | "title"
      | "description"
      | "is_published"
      | "video_url"
      | "content_md"
      | "duration_minutes"
      | "deck_path"
    >
  > | null
}

// Use shared provider inference; cast union to ModuleResourceProvider
function inferResourceProvider(rawUrl: string | null | undefined): ModuleResourceProvider {
  return inferProviderSlug(rawUrl) as ModuleResourceProvider
}

function normalizeAssignmentFieldType(type: unknown, variant?: unknown): ModuleAssignmentField["type"] {
  return normalizeFormFieldTypeLegacy(type, variant)
}

// toNumberOrNull is provided by lessons/fields

function makeSafeKey(value: string, fallback: string): string {
  const sanitized = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
  return sanitized.length > 0 ? sanitized : fallback
}

export function parseAssignmentFields(schema: unknown): ModuleAssignmentField[] {
  if (!schema || typeof schema !== "object") {
    return []
  }

  const fieldsArray = Array.isArray((schema as { fields?: unknown[] }).fields)
    ? ((schema as { fields?: unknown[] }).fields as unknown[])
    : []

  const usedNames = new Set<string>()
  const normalized: ModuleAssignmentField[] = []

  fieldsArray.forEach((field, index) => {
    if (!field || typeof field !== "object") return

    const rawType = (field as { type?: unknown }).type
    const variant = (field as { variant?: unknown }).variant
    const normalizedType = normalizeAssignmentFieldType(rawType, variant)

    const rawName = typeof (field as { name?: unknown }).name === "string" ? (field as { name: string }).name : ""
    const baseKey = makeSafeKey(rawName, `field_${index + 1}`)
    let name = baseKey
    let attempt = 1
    while (usedNames.has(name)) {
      name = `${baseKey}_${attempt}`
      attempt += 1
    }
    usedNames.add(name)

    const rawLabel = typeof (field as { label?: unknown }).label === "string" ? (field as { label: string }).label : ""
    const label = rawLabel.trim().length > 0 ? rawLabel.trim() : name

    const placeholderRaw = typeof (field as { placeholder?: unknown }).placeholder === "string"
      ? (field as { placeholder: string }).placeholder
      : ""
    const placeholder = placeholderRaw.trim().length > 0 ? placeholderRaw.trim() : undefined

    const descriptionRaw = typeof (field as { description?: unknown }).description === "string"
      ? (field as { description: string }).description
      : ""
    const description = descriptionRaw.trim().length > 0 ? descriptionRaw.trim() : undefined

    const optionsRaw = Array.isArray((field as { options?: unknown }).options)
      ? ((field as { options: unknown[] }).options as unknown[])
      : []
    const options = optionsRaw
      .map((option) => String(option).trim())
      .filter((option) => option.length > 0)

    const min = toNumberOrNull((field as { min?: unknown }).min)
    const max = toNumberOrNull((field as { max?: unknown }).max)
    const step = toNumberOrNull((field as { step?: unknown }).step)

    const programTemplateRaw = typeof (field as { programTemplate?: unknown }).programTemplate === "string"
      ? (field as { programTemplate: string }).programTemplate
      : ""
    const programTemplate = programTemplateRaw.trim().length > 0 ? programTemplateRaw.trim() : undefined

    const required = normalizedType === "subtitle" ? false : Boolean((field as { required?: unknown }).required)

    const assignmentField: ModuleAssignmentField = {
      name,
      label,
      type: normalizedType,
      required,
    }

    if (placeholder) assignmentField.placeholder = placeholder
    if (description) assignmentField.description = description

    if (normalizedType === "select" || normalizedType === "multi_select") {
      if (options.length > 0) {
        assignmentField.options = options
      }
    }

    if (normalizedType === "slider") {
      const resolvedMin = min ?? 0
      let resolvedMax = max ?? resolvedMin + 100
      if (resolvedMax < resolvedMin) {
        resolvedMax = resolvedMin
      }
      const resolvedStep = step && step > 0 ? step : 1
      assignmentField.min = resolvedMin
      assignmentField.max = resolvedMax
      assignmentField.step = resolvedStep
    }

    if (normalizedType === "custom_program" && programTemplate) {
      assignmentField.programTemplate = programTemplate
    }

    normalized.push(assignmentField)
  })

  return normalized
}

function parseLegacyHomework(raw: unknown): ModuleAssignmentField[] {
  if (!Array.isArray(raw)) {
    return []
  }

  const usedNames = new Set<string>()

  return raw
    .map((item, index) => {
      if (!item || typeof item !== "object") return null
      const labelRaw = typeof (item as { label?: unknown }).label === "string" ? (item as { label: string }).label : ""
      const label = labelRaw.trim().length > 0 ? labelRaw.trim() : `Homework ${index + 1}`
      const instructionsRaw = typeof (item as { instructions?: unknown }).instructions === "string"
        ? (item as { instructions: string }).instructions
        : ""
      const description = instructionsRaw.trim().length > 0 ? instructionsRaw.trim() : undefined
      const uploadRequired = Boolean((item as { upload_required?: unknown }).upload_required)

      const baseKey = makeSafeKey(label, `legacy_homework_${index + 1}`)
      let name = baseKey
      let attempt = 1
      while (usedNames.has(name)) {
        name = `${baseKey}_${attempt}`
        attempt += 1
      }
      usedNames.add(name)

      const field: ModuleAssignmentField = {
        name,
        label,
        type: "long_text",
        required: uploadRequired,
      }
      if (description) {
        field.description = description
      }
      return field
    })
    .filter((value): value is ModuleAssignmentField => Boolean(value))
}

export async function getClassModulesForUser({
  classSlug,
  userId,
  forceAdmin = false,
}: {
  classSlug: string
  userId: string
  forceAdmin?: boolean
}): Promise<ClassModuleResult> {
  const supabase = await createSupabaseServerClient()
  const elevated = forceAdmin ? createSupabaseAdminClient() : null
  const primary = elevated ?? supabase

  let classRow: unknown | null = null
  {
    // Prefer expanded module fields; fall back on 42703
    const { data, error } = await primary
      .from("classes" satisfies keyof Database["public"]["Tables"])
      .select(
        `id, title, description, subtitle, video_url, link1_title, link1_url, link2_title, link2_url, link3_title, link3_url, is_published, modules ( id, idx, slug, title, description, is_published, video_url, content_md, duration_minutes, deck_path )`
      )
      .eq("slug", classSlug)
      .maybeSingle()
    if (error) {
      // Fallback for local schemas missing some columns
      if ((error as { code?: string }).code === "42703") {
        const { data: fallback, error: err2 } = await primary
          .from("classes" satisfies keyof Database["public"]["Tables"])
          .select(`id, title, description, published, modules ( id, idx, slug, title, description, published )`)
          .eq("slug", classSlug)
          .maybeSingle()
        if (err2) throw err2
        classRow = fallback
      } else {
        throw error
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
          `id, title, description, subtitle, video_url, link1_title, link1_url, link2_title, link2_url, link3_title, link3_url, is_published, modules ( id, idx, slug, title, description, is_published, video_url, content_md, duration_minutes, deck_path )`
        )
        .eq("slug", classSlug)
        .maybeSingle()
      classRow = adminData
    } catch {
      // Ignore; will 404 below if still null
    }
  }

  if (!classRow) {
    notFound()
  }

  const classRecord = classRow as ClassWithModules
  // Build class-level resources and video URL
  const classVideoUrl = (classRecord as { video_url?: string | null }).video_url ?? null
  const classResources: ModuleResource[] = []
  const linkPairs: Array<[string | null | undefined, string | null | undefined]> = [
    [(classRecord as any).link1_title, (classRecord as any).link1_url],
    [(classRecord as any).link2_title, (classRecord as any).link2_url],
    [(classRecord as any).link3_title, (classRecord as any).link3_url],
  ]
  for (const [t, u] of linkPairs) {
    const title = (t ?? '').trim()
    const url = (u ?? '').trim()
    if (!title && !url) continue
    const label = title || url
    classResources.push({ label, url, provider: inferResourceProvider(url) })
  }

  const moduleRows = (classRecord.modules ?? []).sort((a, b) => (a.idx ?? 0) - (b.idx ?? 0))

  if (moduleRows.length === 0) {
    return {
      classId: classRecord.id,
      classTitle: classRecord.title,
      classDescription: classRecord.description ?? null,
      classSubtitle: (classRecord as { subtitle?: string | null }).subtitle ?? null,
      classVideoUrl,
      classResources,
      classPublished:
        "is_published" in classRecord
          ? Boolean((classRecord as { is_published?: boolean | null }).is_published)
          : Boolean((classRecord as { published?: boolean | null }).published ?? true),
      modules: [],
      progressMap: {},
    }
  }

  const moduleIds = moduleRows.map((module) => module.id)

  const contentByModuleId = new Map<
    string,
    { videoUrl: string | null; resources: ModuleResource[]; legacyHomework: ModuleAssignmentField[] }
  >()

  {
    const { data: contentRows, error: contentError } = await primary
      .from("module_content" satisfies keyof Database["public"]["Tables"])
      .select("module_id, video_url, resources, homework")
      .in("module_id", moduleIds)

    if (contentError) {
      const code = (contentError as { code?: string }).code
      if (code !== "42P01" && code !== "42703") {
        throw contentError
      }
    } else {
      for (const row of (contentRows ?? []) as Array<{
        module_id: string
        video_url: string | null
        resources: unknown
        homework: unknown
      }>) {
        if (!row?.module_id) continue
        const rawResources = Array.isArray(row.resources) ? (row.resources as Array<Record<string, unknown>>) : []
        const resources: ModuleResource[] = rawResources
          .map((resource) => {
            if (!resource || typeof resource !== "object") return null
            const labelRaw = typeof resource.label === "string" ? resource.label : ""
            const urlRaw = typeof resource.url === "string" ? resource.url : ""
            const label = labelRaw.trim().length > 0 ? labelRaw.trim() : urlRaw.trim()
            const url = urlRaw.trim()
            if (!label && !url) return null
            return {
              label: label || url,
              url,
              provider: inferResourceProvider(url),
            }
          })
          .filter((value): value is ModuleResource => Boolean(value))

        const legacyHomework = parseLegacyHomework(row.homework)

        contentByModuleId.set(row.module_id, {
          videoUrl: row.video_url ?? null,
          resources,
          legacyHomework,
        })
      }
    }
  }

  const assignmentByModuleId = new Map<string, ModuleAssignment>()
  {
    const { data: assignmentRows, error: assignmentError } = await primary
      .from("module_assignments" satisfies keyof Database["public"]["Tables"])
      .select("module_id, schema, complete_on_submit")
      .in("module_id", moduleIds)

    if (assignmentError) {
      const code = (assignmentError as { code?: string }).code
      if (code !== "42P01" && code !== "42703") {
        throw assignmentError
      }
    } else {
      for (const row of (assignmentRows ?? []) as Array<{
        module_id: string
        schema: unknown
        complete_on_submit: boolean | null
      }>) {
        if (!row?.module_id) continue
        const fields = parseAssignmentFields(row.schema)
        if (fields.length === 0) continue
        assignmentByModuleId.set(row.module_id, {
          fields,
          completeOnSubmit: Boolean(row.complete_on_submit),
        })
      }
    }
  }

  const submissionByModuleId = new Map<string, ModuleAssignmentSubmission>()
  {
    const { data: submissionRows, error: submissionError } = await supabase
      .from("assignment_submissions" satisfies keyof Database["public"]["Tables"])
      .select("module_id, answers, status, updated_at")
      .eq("user_id", userId)
      .in("module_id", moduleIds)

    if (submissionError) {
      const code = (submissionError as { code?: string }).code
      if (code !== "42P01" && code !== "42703") {
        throw submissionError
      }
    } else {
      for (const row of (submissionRows ?? []) as Array<{
        module_id: string
        answers: unknown
        status: string | null
        updated_at: string | null
      }>) {
        if (!row?.module_id) continue
        const answers = row.answers && typeof row.answers === "object" && !Array.isArray(row.answers)
          ? (row.answers as Record<string, unknown>)
          : {}
        const rawStatus = typeof row.status === "string" ? row.status : "submitted"
        const status: ModuleAssignmentSubmission["status"] =
          rawStatus === "accepted" || rawStatus === "revise" ? rawStatus : "submitted"
        submissionByModuleId.set(row.module_id, {
          answers,
          status,
          updatedAt: row.updated_at ?? null,
        })
      }
    }
  }

  const modules: ModuleRecord[] = moduleRows.map((module, index) => {
    const content = contentByModuleId.get(module.id)
    const assignment = assignmentByModuleId.get(module.id)
    const submission = submissionByModuleId.get(module.id)
    const idxValue = typeof module.idx === "number" && Number.isFinite(module.idx) ? module.idx : index + 1
    const legacyAssignment = content?.legacyHomework ?? []
    const resolvedAssignment = assignment
      ? assignment
      : legacyAssignment.length > 0
        ? { fields: legacyAssignment, completeOnSubmit: false }
        : null

    const moduleVideo = (module as { video_url?: string | null }).video_url ?? null
    const contentVideo = content?.videoUrl ?? null

    return {
      id: module.id,
      idx: idxValue,
      slug: module.slug,
      title: module.title,
      description: module.description ?? null,
      videoUrl: moduleVideo ?? contentVideo,
      contentMd: (module as { content_md?: string | null }).content_md ?? null,
      durationMinutes: (module as { duration_minutes?: number | null }).duration_minutes ?? null,
      published:
        "is_published" in module
          ? Boolean((module as { is_published?: boolean | null }).is_published)
          : Boolean((module as { published?: boolean | null }).published ?? true),
      hasDeck: Boolean((module as { deck_path?: string | null }).deck_path ?? null),
      resources: content?.resources ?? [],
      assignment: resolvedAssignment,
      assignmentSubmission: submission ?? null,
    }
  })

  const { data: progressRows, error: progressError } = await supabase
    .from("module_progress" satisfies keyof Database["public"]["Tables"])
    .select("module_id, status")
    .eq("user_id", userId)
    .in("module_id", moduleIds)

  if (progressError) {
    // If progress table doesn't exist yet in a local env, default to empty
    if ((progressError as { code?: string }).code === "42P01" || (progressError as { code?: string }).code === "42703") {
      return {
        classId: classRecord.id,
        classTitle: classRecord.title,
        classDescription: classRecord.description ?? null,
        classSubtitle: (classRecord as { subtitle?: string | null }).subtitle ?? null,
        classPublished:
          "is_published" in classRecord
            ? Boolean((classRecord as { is_published?: boolean | null }).is_published)
            : Boolean((classRecord as { published?: boolean | null }).published ?? true),
        modules,
        progressMap: {},
      }
    }
    throw progressError
  }

  const progressRecords = (progressRows ?? []) as Array<{ module_id: string; status: string }>
  const progressMap: Record<string, ModuleProgressStatus> = {}
  for (const row of progressRecords) {
    progressMap[row.module_id] = row.status as ModuleProgressStatus
  }

  return {
    classId: classRecord.id,
    classTitle: classRecord.title,
    classDescription: classRecord.description ?? null,
    classSubtitle: (classRecord as { subtitle?: string | null }).subtitle ?? null,
    classVideoUrl,
    classResources,
    classPublished:
      "is_published" in classRecord
        ? Boolean((classRecord as { is_published?: boolean | null }).is_published)
        : Boolean((classRecord as { published?: boolean | null }).published ?? true),
    modules,
    progressMap,
  }
}

type ModuleProgressInsert = Database["public"]["Tables"]["module_progress"]["Insert"]

export async function markModuleCompleted({
  moduleId,
  userId,
  notes,
}: {
  moduleId: string
  userId: string
  notes?: ModuleProgressInsert["notes"]
}) {
  const supabase = await createSupabaseServerClient()

  const upsertPayload: ModuleProgressInsert = {
    user_id: userId,
    module_id: moduleId,
    status: "completed",
    completed_at: new Date().toISOString(),
    notes: notes ?? undefined,
  }

  const { error } = await supabase
    .from("module_progress" satisfies keyof Database["public"]["Tables"])
    .upsert(upsertPayload)

  if (error) {
    throw error
  }
}
