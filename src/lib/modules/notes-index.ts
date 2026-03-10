import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database, Json } from "@/lib/supabase"
import { supabaseErrorToError } from "@/lib/supabase/errors"

type ParsedNotesPayload = {
  content: string
  format: "markdown"
}

type ModuleNotesIndexQueryRow = {
  module_id: string
  updated_at: string
  notes: Json | null
  modules: {
    id: string
    idx: number | null
    title: string | null
    slug: string | null
    classes: {
      title: string | null
      slug: string | null
    } | null
  } | null
}

export type ModuleNoteIndexEntry = {
  moduleId: string
  moduleTitle: string
  moduleIndex: number | null
  classTitle: string | null
  classSlug: string | null
  updatedAt: string
  content: string
  href: string | null
}

function parseNotes(value: Json | null | undefined): ParsedNotesPayload | null {
  if (!value) return null
  if (typeof value === "string") {
    const content = value.trim()
    return content ? { content, format: "markdown" } : null
  }
  if (typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>
    const content = typeof record.content === "string" ? record.content.trim() : ""
    if (!content) return null
    return { content, format: "markdown" }
  }
  return null
}

function buildModuleHref(row: ModuleNotesIndexQueryRow) {
  const classSlug = row.modules?.classes?.slug?.trim() ?? ""
  const moduleIndex = row.modules?.idx
  if (!classSlug) return null
  if (typeof moduleIndex !== "number" || !Number.isFinite(moduleIndex) || moduleIndex <= 0) {
    return null
  }
  return `/accelerator/class/${classSlug}/module/${moduleIndex}?from=documents`
}

export async function listUserModuleNotesIndex({
  supabase,
  userId,
  limit = 24,
}: {
  supabase: SupabaseClient<Database, "public">
  userId: string
  limit?: number
}): Promise<ModuleNoteIndexEntry[]> {
  const { data, error } = await supabase
    .from("module_progress" satisfies keyof Database["public"]["Tables"])
    .select(
      `module_id, updated_at, notes, modules ( id, idx, title, slug, classes ( title, slug ) )`,
    )
    .eq("user_id", userId)
    .not("notes", "is", null)
    .order("updated_at", { ascending: false })
    .limit(limit)

  if (error) {
    throw supabaseErrorToError(error, "Unable to load module notes.")
  }

  const rows = Array.isArray(data) ? (data as unknown as ModuleNotesIndexQueryRow[]) : []

  return rows
    .map((row) => {
      const parsed = parseNotes(row.notes)
      if (!parsed) return null

      return {
        moduleId: row.module_id,
        moduleTitle: row.modules?.title?.trim() || "Untitled module",
        moduleIndex: typeof row.modules?.idx === "number" ? row.modules.idx : null,
        classTitle: row.modules?.classes?.title?.trim() || null,
        classSlug: row.modules?.classes?.slug?.trim() || null,
        updatedAt: row.updated_at,
        content: parsed.content,
        href: buildModuleHref(row),
      } satisfies ModuleNoteIndexEntry
    })
    .filter((row): row is ModuleNoteIndexEntry => Boolean(row))
}
