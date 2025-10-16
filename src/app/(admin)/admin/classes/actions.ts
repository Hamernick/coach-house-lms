"use server"

import { randomUUID } from "node:crypto"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { requireAdmin } from "@/lib/admin/auth"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import type { Database } from "@/lib/supabase"
import {
  LESSON_SUBTITLE_MAX_LENGTH,
  LESSON_TITLE_MAX_LENGTH,
  MODULE_SUBTITLE_MAX_LENGTH,
  MODULE_TITLE_MAX_LENGTH,
  clampText,
} from "@/lib/lessons/limits"

export async function createClassAction() {
  await requireAdmin()
  const supabase = await createSupabaseServerClient()

  const slug = `class-${randomUUID().slice(0, 8)}`

  const insertPayload: Database["public"]["Tables"]["classes"]["Insert"] & Record<string, unknown> = {
    title: clampText("Untitled Class", LESSON_TITLE_MAX_LENGTH),
    slug,
    description: "",
    is_published: false,
  }

  let { data, error } = await supabase
    .from("classes" satisfies keyof Database["public"]["Tables"]) 
    .insert(insertPayload)
    .select("id")
    .single()

  // RLS fallback for admins using service role (server-side only)
  if (error && (error.message?.toLowerCase().includes("row-level security") || error.code === "42501")) {
    const admin = createSupabaseAdminClient()
    const res = await admin
      .from("classes" satisfies keyof Database["public"]["Tables"]) 
      .insert(insertPayload)
      .select("id")
      .single()
    data = res.data as typeof data
    error = res.error as typeof error
  }

  if (error) {
    throw error
  }

  if (data?.id) {
    redirect(`/admin/classes/${data.id}`)
  }
}

export async function deleteClassAction(formData: FormData) {
  const classId = formData.get("classId")

  if (typeof classId !== "string") {
    return
  }

  await requireAdmin()
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from("classes" satisfies keyof Database["public"]["Tables"]) 
    .delete()
    .eq("id", classId)

  if (error && (error.message?.toLowerCase().includes("row-level security") || error.code === "42501")) {
    const admin = createSupabaseAdminClient()
    const res = await admin
      .from("classes" satisfies keyof Database["public"]["Tables"]) 
      .delete()
      .eq("id", classId)
    error = res.error as typeof error
  }

  if (error) {
    throw error
  }

  revalidatePath("/admin/classes")
}

export async function setClassPublishedAction(classId: string, published: boolean) {
  await requireAdmin()
  const supabase = await createSupabaseServerClient()

  const updatePayload: Database["public"]["Tables"]["classes"]["Update"] = { is_published: published }

  const { error } = await supabase
    .from("classes" satisfies keyof Database["public"]["Tables"]) 
    .update(updatePayload)
    .eq("id", classId)

  if (error && (error.message?.toLowerCase().includes("row-level security") || error.code === "42501")) {
    const admin = createSupabaseAdminClient()
    const res = await admin
      .from("classes" satisfies keyof Database["public"]["Tables"]) 
      .update(updatePayload)
      .eq("id", classId)
    error = res.error as typeof error
  }

  if (error) {
    throw error
  }

  const { data: classMeta } = await supabase
    .from("classes" satisfies keyof Database["public"]["Tables"])
    .select("slug")
    .eq("id", classId)
    .maybeSingle<{ slug: string | null }>()

  revalidatePath("/admin/classes")
  revalidatePath(`/admin/classes/${classId}`)
  revalidatePath("/admin/academy")
  revalidatePath("/dashboard", "layout")
  revalidatePath("/dashboard")
  revalidatePath("/training")
  if (classMeta?.slug) {
    revalidatePath(`/class/${classMeta.slug}`)
  }
}

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

  // Determine next position
  const { data: rows } = await supabase
    .from("classes" satisfies keyof Database["public"]["Tables"]) 
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
  const nextPos = ((rows?.[0] as { position?: number } | undefined)?.position ?? 0) + 1

  const insertPayload: Database["public"]["Tables"]["classes"]["Insert"] = {
    title: title.trim(),
    slug: slug.trim(),
    description: typeof description === "string" ? description : null,
    is_published: isPublished,
    // @ts-expect-error local types may not include 'position' in classes yet
    position: nextPos,
    // Note: session_number may not exist in local generated types; cast via any to allow insert
    ...(typeof sessionNumber === 'string' && sessionNumber ? { session_number: Number.parseInt(sessionNumber, 10) } : {}),
  }

  let { data: created, error } = await supabase
    .from("classes" satisfies keyof Database["public"]["Tables"]) 
    .insert(insertPayload)
    .select("id")
    .single()

  if (error && isRlsError(error)) {
    const admin = createSupabaseAdminClient()
    const res = await admin
      .from("classes" satisfies keyof Database["public"]["Tables"]) 
      .insert(insertPayload)
      .select("id")
      .single()
    created = res.data as typeof created
    error = res.error as typeof error
  }

  if (error) return { error: error.message }
  const classId = (created as { id: string }).id

  const modulesCount = typeof initialModules === 'string' && initialModules ? Math.max(0, Math.min(10, Number.parseInt(initialModules, 10))) : 0
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

  revalidatePath("/admin/academy")
  revalidatePath("/admin/classes")
  revalidatePath("/dashboard", "layout")
  revalidatePath("/dashboard")
  revalidatePath("/training")
  return { id: classId }
}

export async function updateClassWizardAction(formData: FormData) {
  const classId = formData.get("classId")
  const payloadRaw = formData.get("payload")

  if (typeof classId !== "string") {
    return { error: "Missing classId" }
  }

  if (typeof payloadRaw !== "string") {
    return { error: "Missing payload" }
  }

  return await updateClassFromLessonWizardPayload(classId, payloadRaw)
}

async function createClassFromLessonWizardPayload(payloadRaw: string) {
  let payload: LessonWizardPayload
  try {
    payload = JSON.parse(payloadRaw) as LessonWizardPayload
  } catch {
    return { error: "Invalid lesson payload" }
  }

  if (!payload || typeof payload !== 'object') {
    return { error: "Invalid lesson payload" }
  }

  const trimmedTitle = typeof payload.title === 'string' ? payload.title.trim() : ''
  const normalizedTitle = clampText(trimmedTitle, LESSON_TITLE_MAX_LENGTH)
  if (normalizedTitle.length === 0) {
    return { error: "Lesson title is required" }
  }

  const modules = Array.isArray(payload.modules) ? payload.modules : []
  if (modules.length === 0) {
    return { error: "Add at least one module before creating the lesson" }
  }

  const trimmedSubtitle = typeof payload.subtitle === 'string' ? payload.subtitle.trim() : ''
  const normalizedSubtitle = clampText(trimmedSubtitle, LESSON_SUBTITLE_MAX_LENGTH)

  await requireAdmin()
  const supabase = await createSupabaseServerClient()
  const admin = createSupabaseAdminClient()

  const slugBase = slugify(normalizedTitle)
  let slugCandidate = slugBase.length > 0 ? slugBase : `class-${randomUUID().slice(0, 8)}`
  if (slugBase.length > 0) {
    slugCandidate = await ensureUniqueClassSlug(supabase, slugBase)
  }

  const { data: rows } = await supabase
    .from("classes" satisfies keyof Database["public"]["Tables"])
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
  const nextPos = ((rows?.[0] as { position?: number } | undefined)?.position ?? 0) + 1

  const description = extractSummary(normalizedSubtitle, payload.body ?? '')

  const classInsert: Database["public"]["Tables"]["classes"]["Insert"] & Record<string, unknown> = {
    title: normalizedTitle,
    slug: slugCandidate,
    description,
    is_published: false,
    // @ts-expect-error local types may not include 'position' in classes yet
    position: nextPos,
  }

  let { data: created, error } = await supabase
    .from("classes" satisfies keyof Database["public"]["Tables"])
    .insert(classInsert)
    .select("id")
    .single()

  if (error && isRlsError(error)) {
    const res = await admin
      .from("classes" satisfies keyof Database["public"]["Tables"])
      .insert(classInsert)
      .select("id")
      .single()
    created = res.data as typeof created
    error = res.error as typeof error
  }

  if (error || !created) {
    return { error: error?.message ?? "Failed to create lesson" }
  }

  const classId = (created as { id: string }).id

  try {
    const moduleInserts: Database["public"]["Tables"]["modules"]["Insert"][] = modules.map((module, index) => {
      const rawModuleTitle = typeof module?.title === 'string' ? module.title.trim() : ''
      const normalizedModuleTitle = clampText(
        rawModuleTitle.length > 0 ? rawModuleTitle : `Module ${index + 1}`,
        MODULE_TITLE_MAX_LENGTH,
      )
      const moduleSlug = `${(slugify(normalizedModuleTitle) || 'module')}-${randomUUID().slice(0, 6)}`
      const contentMarkdown = htmlToMarkdown(module?.body ?? '')

      const rawModuleSubtitle = typeof module?.subtitle === 'string' ? module.subtitle.trim() : ''
      const normalizedModuleSubtitle = rawModuleSubtitle.length > 0
        ? clampText(rawModuleSubtitle, MODULE_SUBTITLE_MAX_LENGTH)
        : null

      return {
        class_id: classId,
        idx: index + 1,
        slug: moduleSlug,
        title: normalizedModuleTitle,
        description: normalizedModuleSubtitle,
        video_url: typeof module?.videoUrl === 'string' && module.videoUrl.trim().length > 0 ? module.videoUrl.trim() : null,
        content_md: contentMarkdown.length > 0 ? contentMarkdown : null,
        is_published: false,
      }
    })

    let { data: insertedModules, error: moduleError } = await supabase
      .from("modules" satisfies keyof Database["public"]["Tables"])
      .insert(moduleInserts)
      .select("id, idx")

    if (moduleError && isRlsError(moduleError)) {
      const res = await admin
        .from("modules" satisfies keyof Database["public"]["Tables"])
        .insert(moduleInserts)
        .select("id, idx")
      insertedModules = res.data as typeof insertedModules
      moduleError = res.error as typeof moduleError
    }

    if (moduleError || !insertedModules) {
      throw new Error(moduleError?.message ?? "Failed to create modules")
    }

    const moduleIdByIndex = new Map<number, string>()
    for (const row of insertedModules as Array<{ id: string; idx: number }>) {
      moduleIdByIndex.set(row.idx, row.id)
    }

    const moduleContentRows: Database["public"]["Tables"]["module_content"]["Insert"][] = []
    const assignmentUpserts: Database["public"]["Tables"]["module_assignments"]["Insert"][] = []

    modules.forEach((module, moduleIndex) => {
      const idx = moduleIndex + 1
      const moduleId = moduleIdByIndex.get(idx)
      if (!moduleId) {
        return
      }

      const resources = buildResourcePayload(module?.resources ?? [], moduleIndex === 0 ? payload.links ?? [] : [])
      const videoUrl = typeof module?.videoUrl === 'string' && module.videoUrl.trim().length > 0 ? module.videoUrl.trim() : null

      if (resources.length > 0 || videoUrl) {
        const contentRow: Database["public"]["Tables"]["module_content"]["Insert"] = {
          module_id: moduleId,
        }
        if (videoUrl) {
          contentRow.video_url = videoUrl
        }
        if (resources.length > 0) {
          contentRow.resources = resources as Database["public"]["Tables"]["module_content"]["Insert"]["resources"]
        }
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
        contentResult = await admin
          .from("module_content" satisfies keyof Database["public"]["Tables"])
          .upsert(moduleContentRows, { onConflict: "module_id" })
      }
      if (contentResult.error) {
        throw new Error(contentResult.error.message)
      }
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
      if (assignmentResult.error) {
        throw new Error(assignmentResult.error.message)
      }
    }
  } catch (err) {
    await safeDeleteClass(classId, supabase, admin)
    return { error: err instanceof Error ? err.message : "Failed to create lesson" }
  }

  revalidatePath("/admin/academy")
  revalidatePath("/admin/classes")
  revalidatePath(`/admin/classes/${classId}`)
  revalidatePath("/dashboard", "layout")
  revalidatePath("/dashboard")
  revalidatePath("/training")
  revalidatePath("/dashboard", "layout")
  revalidatePath("/dashboard")
  revalidatePath("/training")
  revalidatePath("/dashboard", "layout")
  revalidatePath("/dashboard")
  revalidatePath("/training")
  revalidatePath("/dashboard", "layout")
  revalidatePath("/dashboard")
  revalidatePath("/training")
  revalidatePath("/dashboard", "layout")
  revalidatePath("/dashboard")
  revalidatePath("/training")
  const classSlugTarget = slugCandidate
  if (classSlugTarget) {
    revalidatePath(`/class/${classSlugTarget}`)
  }
  return { id: classId }
}

async function updateClassFromLessonWizardPayload(classId: string, payloadRaw: string) {
  let payload: LessonWizardPayload
  try {
    payload = JSON.parse(payloadRaw) as LessonWizardPayload
  } catch {
    return { error: "Invalid lesson payload" }
  }

  if (!payload || typeof payload !== 'object') {
    return { error: "Invalid lesson payload" }
  }

  const trimmedTitle = typeof payload.title === 'string' ? payload.title.trim() : ''
  const normalizedTitle = clampText(trimmedTitle, LESSON_TITLE_MAX_LENGTH)
  if (normalizedTitle.length === 0) {
    return { error: "Lesson title is required" }
  }

  const rawModules = Array.isArray(payload.modules) ? payload.modules : []
  const modules = rawModules.filter((module): module is LessonWizardModulePayload & { moduleId: string } => {
    return typeof module?.moduleId === 'string' && module.moduleId.trim().length > 0
  })

  if (modules.length === 0) {
    return { error: "No modules available to update" }
  }

  await requireAdmin()
  const supabase = await createSupabaseServerClient()
  const admin = createSupabaseAdminClient()

  const { data: existingClass, error: classFetchError } = await supabase
    .from("classes" satisfies keyof Database["public"]["Tables"])
    .select("id, slug")
    .eq("id", classId)
    .maybeSingle<{ id: string; slug: string | null }>()
  if (classFetchError) {
    return { error: classFetchError.message }
  }
  if (!existingClass) {
    return { error: "Class not found" }
  }

  const trimmedSubtitle = typeof payload.subtitle === 'string' ? payload.subtitle.trim() : ''
  const normalizedSubtitle = clampText(trimmedSubtitle, LESSON_SUBTITLE_MAX_LENGTH)

  const originalSlug = existingClass.slug ?? null
  const slugBase = slugify(normalizedTitle)
  const nextSlug = slugBase.length > 0 ? await ensureUniqueClassSlug(supabase, slugBase, classId) : originalSlug ?? `class-${classId.slice(0, 8)}`
  const description = extractSummary(normalizedSubtitle, payload.body ?? '')

  const classUpdatePayload: Database["public"]["Tables"]["classes"]["Update"] = {
    title: normalizedTitle,
    description,
  }
  if (nextSlug) {
    classUpdatePayload.slug = nextSlug
  }

  let { error: classUpdateError } = await supabase
    .from("classes" satisfies keyof Database["public"]["Tables"])
    .update(classUpdatePayload)
    .eq("id", classId)

  if (classUpdateError && isRlsError(classUpdateError)) {
    const res = await admin
      .from("classes" satisfies keyof Database["public"]["Tables"])
      .update(classUpdatePayload)
      .eq("id", classId)
    classUpdateError = res.error as typeof classUpdateError
  }

  if (classUpdateError) {
    return { error: classUpdateError.message }
  }

  const { data: moduleRows, error: moduleFetchError } = await supabase
    .from("modules" satisfies keyof Database["public"]["Tables"])
    .select("id, idx, title, slug")
    .eq("class_id", classId)

  if (moduleFetchError) {
    return { error: moduleFetchError.message }
  }

  const existingModuleMap = new Map<string, { idx: number; title: string | null; slug: string | null }>()
  for (const row of (moduleRows ?? []) as Array<{ id: string; idx: number; title: string | null; slug: string | null }>) {
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
      if (!existing) {
        continue
      }

      const rawModuleTitle = typeof modulePayload.title === 'string' ? modulePayload.title.trim() : ''
      const normalizedModuleTitle = clampText(
        rawModuleTitle.length > 0 ? rawModuleTitle : existing.title ?? `Module ${existing.idx}`,
        MODULE_TITLE_MAX_LENGTH,
      )

      const rawModuleSubtitle = typeof modulePayload.subtitle === 'string' ? modulePayload.subtitle.trim() : ''
      const normalizedModuleSubtitle = rawModuleSubtitle.length > 0
        ? clampText(rawModuleSubtitle, MODULE_SUBTITLE_MAX_LENGTH)
        : null

      const markdown = htmlToMarkdown(modulePayload.body ?? '')
      const videoUrl =
        typeof modulePayload.videoUrl === 'string' && modulePayload.videoUrl.trim().length > 0
          ? modulePayload.videoUrl.trim()
          : null

      const moduleUpdate: Database["public"]["Tables"]["modules"]["Update"] = {
        title: normalizedModuleTitle,
        description: normalizedModuleSubtitle,
        content_md: markdown.length > 0 ? markdown : null,
        video_url: videoUrl,
        idx: index + 1,
      }

      let { error: moduleUpdateError } = await supabase
        .from("modules" satisfies keyof Database["public"]["Tables"])
        .update(moduleUpdate)
        .eq("id", moduleId)

      if (moduleUpdateError && isRlsError(moduleUpdateError)) {
        const res = await admin
          .from("modules" satisfies keyof Database["public"]["Tables"])
          .update(moduleUpdate)
          .eq("id", moduleId)
        moduleUpdateError = res.error as typeof moduleUpdateError
      }

      if (moduleUpdateError) {
        throw new Error(moduleUpdateError.message)
      }

      moduleRevalidateTargets.push(`/admin/modules/${moduleId}`)

      const resources = buildResourcePayload(modulePayload.resources ?? [], index === 0 ? payload.links ?? [] : [])
      const normalizedResources = resources.length > 0 ? resources : []
      const contentRow: Database["public"]["Tables"]["module_content"]["Insert"] = {
        module_id: moduleId,
        resources: normalizedResources as Database["public"]["Tables"]["module_content"]["Insert"]["resources"],
      }
      contentRow.video_url = videoUrl ?? null
      moduleContentRows.push(contentRow)

      const assignmentSchema = buildAssignmentSchema(modulePayload.formFields ?? [])
      if (assignmentSchema) {
        assignmentUpserts.push({
          module_id: moduleId,
          schema: assignmentSchema as Database["public"]["Tables"]["module_assignments"]["Insert"]["schema"],
          complete_on_submit: true,
        })
      } else {
        modulesWithoutAssignments.push(moduleId)
      }
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
      if (contentResult.error) {
        throw new Error(contentResult.error.message)
      }
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
      if (assignmentResult.error) {
        throw new Error(assignmentResult.error.message)
      }
    }

    if (modulesWithoutAssignments.length > 0) {
      let deleteResult = await supabase
        .from("module_assignments" satisfies keyof Database["public"]["Tables"])
        .delete()
        .in("module_id", modulesWithoutAssignments)
      if (deleteResult.error && isRlsError(deleteResult.error)) {
        deleteResult = await admin
          .from("module_assignments" satisfies keyof Database["public"]["Tables"])
          .delete()
          .in("module_id", modulesWithoutAssignments)
      }
      if (deleteResult.error && deleteResult.error.code !== "PGRST116") {
        throw new Error(deleteResult.error.message)
      }
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update lesson" }
  }

  revalidatePath("/admin/academy")
  revalidatePath("/admin/classes")
  revalidatePath(`/admin/classes/${classId}`)
  revalidatePath("/dashboard", "layout")
  revalidatePath("/dashboard")
  revalidatePath("/training")
  if (originalSlug) {
    revalidatePath(`/class/${originalSlug}`)
  }
  if (nextSlug && nextSlug !== originalSlug) {
    revalidatePath(`/class/${nextSlug}`)
  }
  for (const target of moduleRevalidateTargets) {
    revalidatePath(target)
  }

  return { id: classId }
}

type LessonWizardResourcePayload = {
  title: string
  type?: "link"
  url?: string | null
  provider?: string | null
}

type LessonWizardFormFieldPayload = {
  label: string
  type?: string | null
  required?: boolean | null
  placeholder?: string | null
  description?: string | null
  options?: string[] | null
  min?: number | null
  max?: number | null
  step?: number | null
  programTemplate?: string | null
}

type LessonWizardModulePayload = {
  moduleId?: string
  title: string
  subtitle: string
  body: string
  videoUrl: string
  resources: LessonWizardResourcePayload[]
  formFields: LessonWizardFormFieldPayload[]
}

type LessonWizardPayload = {
  title: string
  subtitle: string
  body: string
  videoUrl: string
  links: Array<{ title: string; url: string; provider?: string | null }>
  modules: LessonWizardModulePayload[]
}

function isRlsError(error: { message?: string | null; code?: string | number | null } | null | undefined) {
  if (!error) return false
  const message = String(error.message ?? '').toLowerCase()
  const code = error.code != null ? String(error.code) : ''
  return message.includes('row-level security') || code === '42501'
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

async function ensureUniqueClassSlug(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  baseSlug: string,
  currentId?: string,
) {
  let attempt = 0
  let candidate = baseSlug
  while (attempt < 5) {
    const { data } = await supabase
      .from("classes" satisfies keyof Database["public"]["Tables"])
      .select("id")
      .eq("slug", candidate)
      .maybeSingle<{ id: string }>()
    if (!data || (currentId && data.id === currentId)) {
      return candidate
    }
    attempt += 1
    candidate = `${baseSlug}-${attempt}`
  }
  return `${baseSlug}-${randomUUID().slice(0, 6)}`
}

function htmlToMarkdown(html: string) {
  if (typeof html !== 'string' || html.trim().length === 0) {
    return ''
  }
  let output = html
    .replace(/<h1[^>]*>/gi, '# ')
    .replace(/<h2[^>]*>/gi, '## ')
    .replace(/<h3[^>]*>/gi, '### ')
    .replace(/<h4[^>]*>/gi, '#### ')
    .replace(/<h5[^>]*>/gi, '##### ')
    .replace(/<h6[^>]*>/gi, '###### ')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<ul[^>]*>/gi, '\n')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<strong[^>]*>/gi, '**')
    .replace(/<\/strong>/gi, '**')
    .replace(/<em[^>]*>/gi, '*')
    .replace(/<\/em>/gi, '*')
  output = output.replace(/<[^>]+>/g, '')
  output = decodeHtmlEntities(output)
  return output
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function extractSummary(subtitle: string, body: string) {
  const trimmedSubtitle = subtitle.trim()
  if (trimmedSubtitle.length > 0) {
    return trimmedSubtitle
  }
  const plain = stripHtml(body)
  if (plain.length === 0) {
    return null
  }
  const summary = plain.slice(0, 240).trim()
  return summary.length > 0 ? summary : null
}

function stripHtml(html: string) {
  if (typeof html !== 'string') {
    return ''
  }
  const output = html
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
  return decodeHtmlEntities(output).replace(/\n{3,}/g, '\n\n').trim()
}

function decodeHtmlEntities(value: string) {
  const str = String(value)
  return str
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function buildResourcePayload(
  resources: LessonWizardResourcePayload[],
  lessonLinks: Array<{ title: string; url: string }>,
) {
  const items: Array<{ label: string; url: string }> = []
  for (const link of lessonLinks) {
    const url = typeof link?.url === 'string' ? link.url.trim() : ''
    if (!url) continue
    const label = typeof link?.title === 'string' && link.title.trim().length > 0 ? link.title.trim() : url
    items.push({ label, url })
  }
  for (const resource of resources) {
    if (!resource) continue
    const url = typeof resource.url === 'string' ? resource.url.trim() : ''
    if (!url) continue
    const label = typeof resource.title === 'string' && resource.title.trim().length > 0 ? resource.title.trim() : url
    items.push({ label, url })
  }
  return items
}

function buildAssignmentSchema(formFields: LessonWizardFormFieldPayload[]) {
  if (!Array.isArray(formFields) || formFields.length === 0) {
    return null
  }

  const fields: Array<Record<string, unknown>> = []
  const usedNames = new Set<string>()

  const normalizeType = (raw: string | null | undefined): string => {
    switch (raw) {
      case 'short_text':
      case 'text':
        return 'short_text'
      case 'long_text':
      case 'textarea':
        return 'long_text'
      case 'select':
        return 'select'
      case 'multi_select':
        return 'multi_select'
      case 'slider':
        return 'slider'
      case 'subtitle':
      case 'display':
        return 'subtitle'
      case 'custom_program':
      case 'program_builder':
        return 'custom_program'
      default:
        return 'short_text'
    }
  }

  formFields.forEach((field, index) => {
    if (!field) return
    const normalizedType = normalizeType(field.type)

    const rawLabel = typeof field.label === 'string' ? field.label.trim() : ''
    const hasLabel = rawLabel.length > 0
    if (!hasLabel && normalizedType !== 'subtitle') {
      return
    }

    const baseSlug = slugify(hasLabel ? rawLabel : `subtitle_${index + 1}`).replace(/-/g, '_') || `field_${index + 1}`
    let name = baseSlug
    let attempt = 1
    while (usedNames.has(name)) {
      name = `${baseSlug}_${attempt}`
      attempt += 1
    }
    usedNames.add(name)

    const placeholder = typeof field.placeholder === 'string' ? field.placeholder.trim() : ''
    const description = typeof field.description === 'string' ? field.description.trim() : ''
    const options = Array.isArray(field.options)
      ? field.options.map((option) => String(option).trim()).filter(Boolean)
      : []
    const minRaw = toNumberOrNull(field.min)
    const maxRaw = toNumberOrNull(field.max)
    const stepRaw = toNumberOrNull(field.step)
    const programTemplate = typeof field.programTemplate === 'string' ? field.programTemplate.trim() : ''

    if (normalizedType === 'subtitle') {
      fields.push({
        name,
        type: 'display',
        variant: 'subtitle',
        label: rawLabel || `Section ${index + 1}`,
        description: description || undefined,
      })
      return
    }

    const entry: Record<string, unknown> = {
      name,
      label: rawLabel,
      type: normalizedType,
      required: Boolean(field.required),
    }

    if (placeholder) entry.placeholder = placeholder
    if (description) entry.description = description

    if (normalizedType === 'select' || normalizedType === 'multi_select') {
      if (options.length > 0) {
        entry.options = options
      }
    }

    if (normalizedType === 'slider') {
      const resolvedMin = minRaw ?? 0
      let resolvedMax = maxRaw ?? resolvedMin + 100
      if (resolvedMax < resolvedMin) {
        resolvedMax = resolvedMin
      }
      const resolvedStep = stepRaw && stepRaw > 0 ? stepRaw : 1
      entry.min = resolvedMin
      entry.max = resolvedMax
      entry.step = resolvedStep
    }

    if (normalizedType === 'custom_program') {
      if (programTemplate) {
        entry.programTemplate = programTemplate
      }
    }

    fields.push(entry)
  })

  if (fields.length === 0) {
    return null
  }

  return { fields }
}

async function safeDeleteClass(
  classId: string,
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  admin: ReturnType<typeof createSupabaseAdminClient>,
) {
  const { error } = await supabase
    .from("classes" satisfies keyof Database["public"]["Tables"])
    .delete()
    .eq("id", classId)
  if (error && isRlsError(error)) {
    await admin
      .from("classes" satisfies keyof Database["public"]["Tables"])
      .delete()
      .eq("id", classId)
  }
}

export async function moveClassPositionAction(formData: FormData) {
  const classId = formData.get("classId")
  const direction = formData.get("direction")
  if (typeof classId !== 'string' || (direction !== 'up' && direction !== 'down')) return

  await requireAdmin()
  const supabase = await createSupabaseServerClient()

  const { data } = await supabase
    .from("classes" satisfies keyof Database["public"]["Tables"]) 
    .select("id, position")
    .order("position")

  const list = ((data ?? []) as unknown as Array<{ id: string; position?: number | null }>).
    map((r, idx) => ({ id: r.id, position: typeof r.position === 'number' ? r.position! : idx + 1 }))

  const idx = list.findIndex((x) => x.id === classId)
  if (idx < 0) return
  const swapWith = direction === 'up' ? idx - 1 : idx + 1
  if (swapWith < 0 || swapWith >= list.length) return

  const a = list[idx]
  const b = list[swapWith]
  const updates: Array<{ id: string; position: number }> = [
    { id: a.id, position: b.position },
    { id: b.id, position: a.position },
  ]

  // Persist swaps
  for (const u of updates) {
    // @ts-expect-error local types may not include 'position' in classes yet
    const response = await supabase.from("classes").update({ position: u.position }).eq("id", u.id)
    let updateError = response.error
    if (isRlsError(updateError)) {
      const admin = createSupabaseAdminClient()
      // @ts-expect-error local types may not include 'position' in classes yet
      const adminResponse = await admin.from("classes").update({ position: u.position }).eq("id", u.id)
      updateError = adminResponse.error
    }
    if (updateError) throw updateError
  }

  revalidatePath("/admin/academy")
  revalidatePath("/admin/classes")
}

export async function reorderClassesAction(orderedIds: string[]) {
  await requireAdmin()
  const supabase = await createSupabaseServerClient()

  const updates = orderedIds.map((id, idx) => ({ id, position: idx + 1 }))
  for (const u of updates) {
    // @ts-expect-error local types may not include 'position' in classes yet
    const response = await supabase.from('classes').update({ position: u.position }).eq('id', u.id)
    let updateError = response.error
    if (isRlsError(updateError)) {
      const admin = createSupabaseAdminClient()
      // @ts-expect-error local types may not include 'position' in classes yet
      const adminResponse = await admin.from('classes').update({ position: u.position }).eq('id', u.id)
      updateError = adminResponse.error
    }
    if (updateError) throw updateError
  }

  revalidatePath('/admin/academy')
  revalidatePath('/admin/classes')
  revalidatePath('/dashboard', 'layout')
  revalidatePath('/dashboard')
  revalidatePath('/training')
}
