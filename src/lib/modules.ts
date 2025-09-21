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
      "id" | "idx" | "slug" | "title" | "description" | "video_url" | "content_md" | "duration_minutes" | "published"
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
  const supabase = createSupabaseServerClient()

  const { data: classRow, error } = await supabase
    .from("classes" satisfies keyof Database["public"]["Tables"])
    .select(
      `id, title, description, published, modules ( id, idx, slug, title, description, video_url, content_md, duration_minutes, published )`
    )
    .eq("slug", classSlug)
    .maybeSingle()

  if (error) {
    throw error
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
      videoUrl: module.video_url ?? null,
      contentMd: module.content_md ?? null,
      durationMinutes: module.duration_minutes ?? null,
      published: module.published,
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
  const supabase = createSupabaseServerClient()

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
