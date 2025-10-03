import { notFound } from "next/navigation"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase"

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
}

export type ModuleProgressStatus = "not_started" | "in_progress" | "completed"

type ClassModuleResult = {
  classId: string
  classTitle: string
  classDescription: string | null
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
      | "published"
      | "video_url"
      | "content_md"
      | "duration_minutes"
      | "deck_path"
    >
  > | null
}

export async function getClassModulesForUser({
  classSlug,
  userId,
}: {
  classSlug: string
  userId: string
}): Promise<ClassModuleResult> {
  const supabase = await createSupabaseServerClient()

  let classRow: unknown | null = null
  {
    // Prefer expanded module fields; fall back on 42703
    const { data, error } = await supabase
      .from("classes" satisfies keyof Database["public"]["Tables"])
      .select(
        `id, title, description, published, modules ( id, idx, slug, title, description, published, video_url, content_md, duration_minutes, deck_path )`
      )
      .eq("slug", classSlug)
      .maybeSingle()
    if (error) {
      // Fallback for local schemas missing some columns
      if ((error as { code?: string }).code === "42703") {
        const { data: fallback, error: err2 } = await supabase
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
    notFound()
  }

  const classRecord = classRow as ClassWithModules

  const modules = (classRecord.modules ?? [])
    .filter((module) => module.published)
    .sort((a, b) => a.idx - b.idx)
    .map((module) => ({
      id: module.id,
      idx: module.idx,
      slug: module.slug,
      title: module.title,
      description: module.description ?? null,
      videoUrl: (module as { video_url?: string | null }).video_url ?? null,
      contentMd: (module as { content_md?: string | null }).content_md ?? null,
      durationMinutes: (module as { duration_minutes?: number | null }).duration_minutes ?? null,
      published: ("published" in module ? (module as { published?: boolean }).published ?? true : true),
      hasDeck: Boolean((module as { deck_path?: string | null }).deck_path ?? null),
    }))

  if (modules.length === 0) {
    return {
      classId: classRecord.id,
      classTitle: classRecord.title,
      classDescription: classRecord.description ?? null,
      modules: [],
      progressMap: {},
    }
  }

  const moduleIds = modules.map((module) => module.id)

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
