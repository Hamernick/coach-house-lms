"use server"

import { redirect } from "next/navigation"

import { requireAdmin } from "@/lib/admin/auth"
import { uploadModuleDeck, removeModuleDeck } from "@/lib/storage/decks"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase"
import { supabaseErrorToError } from "@/lib/supabase/errors"
import {
  MODULE_SUBTITLE_MAX_LENGTH,
  MODULE_TITLE_MAX_LENGTH,
  clampText,
} from "@/lib/lessons/limits"
import { revalidateClassViews } from "@/app/(admin)/admin/classes/actions"

type SupabaseServer = Awaited<ReturnType<typeof createSupabaseServerClient>>

async function revalidateModuleViews(
  supabase: SupabaseServer,
  moduleId: string,
  classId?: string | null,
  options: { fallbackSlug?: string | null; fallbackIdx?: number | null } = {},
) {
  let resolvedClassId = classId ?? null
  let resolvedClassSlug: string | null = options.fallbackSlug ?? null
  let resolvedModuleIdx: number | null | undefined = options.fallbackIdx

  if (!resolvedClassId || resolvedClassSlug == null || resolvedModuleIdx == null) {
    const { data: moduleMeta } = await supabase
      .from("modules" satisfies keyof Database["public"]["Tables"])
      .select("class_id, idx, slug, classes ( slug )")
      .eq("id", moduleId)
      .maybeSingle<{
        class_id: string | null
        idx: number | null
        slug: string | null
        classes: { slug: string | null } | null
      }>()

    resolvedClassId = resolvedClassId ?? moduleMeta?.class_id ?? null
    resolvedClassSlug = resolvedClassSlug ?? moduleMeta?.classes?.slug ?? null
    resolvedModuleIdx = resolvedModuleIdx ?? moduleMeta?.idx ?? null
  }

  await revalidateClassViews({
    classId: resolvedClassId,
    classSlug: resolvedClassSlug,
    additionalTargets: [
      `/admin/modules/${moduleId}`,
      ...(resolvedClassSlug != null && resolvedModuleIdx != null
        ? [`/class/${resolvedClassSlug}/module/${resolvedModuleIdx}`]
        : []),
    ],
  })
}

export async function updateModuleDetailsAction(formData: FormData) {
  const moduleId = formData.get("moduleId")
  const classId = formData.get("classId")
  const title = formData.get("title")
  const slug = formData.get("slug")
  const description = formData.get("description")
  const videoUrl = formData.get("videoUrl")
  const duration = formData.get("durationMinutes")
  const content = formData.get("contentMd")

  if (
    typeof moduleId !== "string" ||
    typeof classId !== "string" ||
    typeof title !== "string" ||
    typeof slug !== "string"
  ) {
    return
  }

  await requireAdmin()
  const supabase = await createSupabaseServerClient()

  const durationValue =
    typeof duration === "string" && duration.length > 0
      ? Number.parseInt(duration, 10)
      : null

  const normalizedDuration =
    typeof durationValue === "number" && Number.isFinite(durationValue) ? durationValue : null

  const trimmedTitle = typeof title === "string" ? title.trim() : ""
  const normalizedTitle = clampText(trimmedTitle, MODULE_TITLE_MAX_LENGTH)

  const rawDescription = typeof description === "string" ? description : ""
  const normalizedDescription = rawDescription.trim().length > 0
    ? clampText(rawDescription.trim(), MODULE_SUBTITLE_MAX_LENGTH)
    : null

  const updatePayload: Database["public"]["Tables"]["modules"]["Update"] = {
    title: normalizedTitle,
    slug: slug.trim(),
    description: normalizedDescription,
    video_url: typeof videoUrl === "string" && videoUrl.length > 0 ? videoUrl : null,
    duration_minutes: normalizedDuration,
    content_md: typeof content === "string" ? content : null,
  }

  const { error } = await supabase
    .from("modules" satisfies keyof Database["public"]["Tables"])
    .update(updatePayload)
    .eq("id", moduleId)

  if (error) {
    throw supabaseErrorToError(error, "Unable to update module.")
  }

  await revalidateModuleViews(supabase, moduleId, classId)
}

export async function deleteModuleFromDetailAction(formData: FormData) {
  const moduleId = formData.get("moduleId")
  const classId = formData.get("classId")

  if (typeof moduleId !== "string" || typeof classId !== "string") {
    return
  }

  await requireAdmin()
  const supabase = await createSupabaseServerClient()

  const { data: moduleMeta } = await supabase
    .from("modules" satisfies keyof Database["public"]["Tables"])
    .select("class_id, idx, slug, classes ( slug )")
    .eq("id", moduleId)
    .maybeSingle<{
      class_id: string | null
      idx: number | null
      slug: string | null
      classes: { slug: string | null } | null
    }>()

  const { error } = await supabase
    .from("modules" satisfies keyof Database["public"]["Tables"])
    .delete()
    .eq("id", moduleId)

  if (error) {
    throw supabaseErrorToError(error, "Unable to delete module.")
  }

  await revalidateClassViews({
    classId,
    classSlug: moduleMeta?.classes?.slug ?? null,
    additionalTargets: [
      `/admin/modules/${moduleId}`,
      ...(moduleMeta?.classes?.slug && moduleMeta?.idx != null
        ? [`/class/${moduleMeta.classes.slug}/module/${moduleMeta.idx}`]
        : []),
    ],
  })
  redirect("/internal")
}

export async function uploadModuleDeckAction(formData: FormData) {
  const moduleId = formData.get("moduleId")
  const classId = formData.get("classId")
  const file = formData.get("deck")

  if (typeof moduleId !== "string" || typeof classId !== "string" || !(file instanceof File)) {
    return
  }

  if (file.size === 0) {
    return
  }

  if (file.type !== "application/pdf") {
    throw new Error("Deck must be a PDF file")
  }

  if (file.size > 15 * 1024 * 1024) {
    throw new Error("Deck exceeds 15MB limit")
  }

  await requireAdmin()
  const supabase = await createSupabaseServerClient()

  const { data: moduleRow, error } = await supabase
    .from("modules" satisfies keyof Database["public"]["Tables"])
    .select("deck_path")
    .eq("id", moduleId)
    .maybeSingle<Pick<Database["public"]["Tables"]["modules"]["Row"], "deck_path">>()

  if (error) {
    throw supabaseErrorToError(error, "Unable to load module deck state.")
  }

  const deckPath = await uploadModuleDeck({
    moduleId,
    filename: file.name,
    fileBuffer: await file.arrayBuffer(),
    previousPath: moduleRow?.deck_path ?? undefined,
  })

  const deckUpdatePayload: Database["public"]["Tables"]["modules"]["Update"] = {
    deck_path: deckPath,
  }

  const { error: updateError } = await supabase
    .from("modules" satisfies keyof Database["public"]["Tables"])
    .update(deckUpdatePayload)
    .eq("id", moduleId)

  if (updateError) {
    throw supabaseErrorToError(updateError, "Unable to update module deck.")
  }

  await revalidateModuleViews(supabase, moduleId, classId)
}

export async function removeModuleDeckAction(formData: FormData) {
  const moduleId = formData.get("moduleId")
  const classId = formData.get("classId")

  if (typeof moduleId !== "string" || typeof classId !== "string") {
    return
  }

  await requireAdmin()
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("modules" satisfies keyof Database["public"]["Tables"])
    .select("deck_path")
    .eq("id", moduleId)
    .maybeSingle<Pick<Database["public"]["Tables"]["modules"]["Row"], "deck_path">>()

  if (error) {
    throw supabaseErrorToError(error, "Unable to load module deck state.")
  }

  if (data?.deck_path) {
    await removeModuleDeck(data.deck_path)
  }

  const clearDeckPayload: Database["public"]["Tables"]["modules"]["Update"] = {
    deck_path: null,
  }

  const { error: updateError } = await supabase
    .from("modules" satisfies keyof Database["public"]["Tables"])
    .update(clearDeckPayload)
    .eq("id", moduleId)

  if (updateError) {
    throw supabaseErrorToError(updateError, "Unable to update module deck.")
  }

  await revalidateModuleViews(supabase, moduleId, classId)
}

export async function updateModuleAssignmentAction(formData: FormData) {
  const moduleId = formData.get("moduleId")
  const schemaText = formData.get("schema")
  const completeOnSubmit = formData.get("completeOnSubmit") === "true"

  if (typeof moduleId !== "string" || typeof schemaText !== "string") {
    return
  }

  await requireAdmin()
  const supabase = await createSupabaseServerClient()

  let schema: Database["public"]["Tables"]["module_assignments"]["Insert"]["schema"]
  try {
    const obj = JSON.parse(schemaText)
    schema = obj
  } catch {
    throw new Error("Invalid JSON schema")
  }

  const upsertPayload: Database["public"]["Tables"]["module_assignments"]["Insert"] = {
    module_id: moduleId,
    schema,
    complete_on_submit: completeOnSubmit,
  }

  const { error } = await supabase
    .from("module_assignments" satisfies keyof Database["public"]["Tables"])
    .upsert(upsertPayload)

  if (error) throw supabaseErrorToError(error, "Unable to update module assignment.")

  await revalidateModuleViews(supabase, moduleId)
}

export async function updateModuleContentAction(formData: FormData) {
  const moduleId = formData.get("moduleId")
  const transcript = formData.get("transcript")
  const interactions = formData.get("interactions")
  const resources = formData.get("resources")
  const homework = formData.get("homework")
  const adminNotes = formData.get("adminNotes")

  if (typeof moduleId !== "string") return

  await requireAdmin()
  const supabase = await createSupabaseServerClient()

  type JsonType = Database["public"]["Tables"]["assignment_submissions"]["Insert"]["answers"]
  const parseJson = (val: FormDataEntryValue | null): JsonType => {
    if (typeof val !== "string" || val.trim().length === 0) return [] as unknown as JsonType
    try {
      const v = JSON.parse(val)
      return v as JsonType
    } catch {
      throw new Error("Invalid JSON provided for one of the content fields")
    }
  }

  type ModuleContentInsert = {
    module_id: string
    transcript?: string | null
    talking_points?: JsonType
    interactions?: JsonType
    resources?: JsonType
    homework?: JsonType
    admin_notes?: string | null
  }
  const upsertPayload: ModuleContentInsert = {
    module_id: moduleId,
    transcript: typeof transcript === "string" ? transcript : null,
    interactions: parseJson(interactions),
    resources: parseJson(resources),
    homework: parseJson(homework),
    admin_notes: typeof adminNotes === "string" ? adminNotes : null,
  }

  const client = supabase as unknown as {
    from: (t: string) => {
      upsert: (
        v: unknown,
        opts?: { onConflict?: string }
      ) => Promise<{ error: { message?: string } | null }>
    }
  }
  const { error } = await client.from("module_content").upsert(upsertPayload, { onConflict: "module_id" })

  if (error) throw supabaseErrorToError(error, "Unable to update module content.")

  await revalidateModuleViews(supabase, moduleId)
}

export async function generateSignedUrlAction(bucket: string, path: string) {
  "use server"

  await requireAdmin()
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60)
  if (error) throw supabaseErrorToError(error, "Unable to create signed URL.")
  return data.signedUrl as string
}
