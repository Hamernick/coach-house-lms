import { createSupabaseServerClient } from "@/lib/supabase/server"

export type SidebarModule = {
  id: string
  index: number
  title: string
  published: boolean
}

export type SidebarClass = {
  id: string
  slug: string
  title: string
  published: boolean
  position?: number | null
  modules: SidebarModule[]
}

/**
 * Fetch classes + modules for the Academy sidebar.
 * - Includes drafts when includeDrafts=true (admins)
 * - Falls back across legacy/new column names
 */
export async function fetchSidebarTree({ includeDrafts }: { includeDrafts: boolean }): Promise<SidebarClass[]> {
  const supabase = await createSupabaseServerClient()

  // Prefer new columns; fall back to legacy on 42703 (undefined_column)
  type ClassRow = {
    id: string
    slug: string
    title: string
    is_published?: boolean | null
    published?: boolean | null
    position?: number | null
    modules: Array<{
      id: string
      title: string
      index_in_class?: number | null
      idx?: number | null
      is_published?: boolean | null
      published?: boolean | null
    }> | null
  }

  let classes: ClassRow[] | null = null
  {
    const { data, error } = await supabase
      .from("classes")
      .select("id, slug, title, is_published, position, modules ( id, title, index_in_class, is_published )")
    if (error) {
      // Fallback to legacy columns
      if ((error as { code?: string }).code === "42703") {
        const { data: legacy, error: err2 } = await supabase
          .from("classes")
          .select("id, slug, title, published, position, modules ( id, title, idx, published )")
        if (err2) throw err2
        classes = legacy as unknown as ClassRow[]
      } else {
        throw error
      }
    } else {
      classes = data as unknown as ClassRow[]
    }
  }

  const normalized: SidebarClass[] = (classes ?? []).map((c) => {
    const classPublished = (typeof c.is_published === "boolean" ? c.is_published : c.published) ?? false
    const mods = (c.modules ?? []).map((m) => {
      const idx = (typeof m.index_in_class === "number" && Number.isFinite(m.index_in_class))
        ? m.index_in_class!
        : (typeof m.idx === "number" && Number.isFinite(m.idx)) ? m.idx! : 0
      const pub = (typeof m.is_published === "boolean" ? m.is_published : m.published) ?? true
      return {
        id: m.id,
        index: idx,
        title: m.title,
        published: pub,
      } satisfies SidebarModule
    })
    // sort modules by index
    mods.sort((a, b) => a.index - b.index)

    return {
      id: c.id,
      slug: c.slug,
      title: c.title,
      published: classPublished,
      position: typeof (c as { position?: number | null }).position === 'number' ? (c as { position?: number | null }).position : null,
      modules: mods,
    } satisfies SidebarClass
  })

  // If not admin, only published classes/modules should appear; RLS should already limit,
  // but we filter as a safeguard.
  const filtered = includeDrafts
    ? normalized
    : normalized
        .filter((c) => c.published)
        .map((c) => ({
          ...c,
          modules: c.modules.filter((m) => m.published),
        }))

  // Sort classes by position then title as stable default
  filtered.sort((a, b) => {
    const pa = typeof a.position === 'number' ? a.position! : 9999
    const pb = typeof b.position === 'number' ? b.position! : 9999
    if (pa !== pb) return pa - pb
    return a.title.localeCompare(b.title)
  })

  return filtered
}
