import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { supabaseErrorToError } from "@/lib/supabase/errors"
import { env } from "@/lib/env"
import { unstable_cache } from "next/cache"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

export type SidebarModule = {
  id: string
  slug?: string | null
  index: number
  title: string
  description: string | null
  published: boolean
}

export type SidebarClass = {
  id: string
  slug: string
  title: string
  description: string | null
  published: boolean
  position?: number | null
  modules: SidebarModule[]
}

type FetchSidebarOptions = {
  includeDrafts: boolean
  forceAdmin?: boolean
}

type FetchSidebarInternalOptions = FetchSidebarOptions & {
  clientOverride?: SupabaseClient<Database, "public">
}

/**
 * Fetch classes + modules for the Academy sidebar / training shell.
 * - `includeDrafts=true` keeps unpublished items (used for admins or preview modes)
 * - `forceAdmin=true` uses the service-role client to bypass RLS (needed for learners).
 */
async function fetchSidebarTreeUncached({
  includeDrafts,
  forceAdmin = false,
  clientOverride,
}: FetchSidebarInternalOptions): Promise<SidebarClass[]> {
  const supabase = clientOverride
    ? clientOverride
    : forceAdmin
    ? (() => {
        try {
          return createSupabaseAdminClient()
        } catch {
          return null
        }
      })()
    : null

  const client = supabase ?? (await createSupabaseServerClient())

  type ClassRow = {
    id: string
    slug: string
    title: string
    description?: string | null
    is_published?: boolean | null
    published?: boolean | null
    position?: number | null
    modules: Array<{
      id: string
      slug?: string | null
      title: string
      description?: string | null
      index_in_class?: number | null
      idx?: number | null
      is_published?: boolean | null
      published?: boolean | null
    }> | null
  }

  let classes: ClassRow[] | null = null

  const slugifyModuleTitle = (title: string) =>
    title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

  {
    const { data, error } = await client
      .from("classes")
      .select(
        "id, slug, title, description, is_published, position, modules ( id, slug, title, description, index_in_class, idx, is_published )"
      )

    if (error) {
      if ((error as { code?: string }).code === "42703") {
        const { data: fallback, error: err2 } = await client
          .from("classes")
          .select("id, slug, title, description, published, position, modules ( id, slug, title, description, idx, published )")
        if (err2) throw supabaseErrorToError(err2, "Unable to load classes.")
        classes = fallback as unknown as ClassRow[]
      } else {
        throw supabaseErrorToError(error, "Unable to load classes.")
      }
    } else {
      classes = data as unknown as ClassRow[]
    }
  }

  const normalized: SidebarClass[] = (classes ?? []).map((klass) => {
    const classPublished =
      (typeof klass.is_published === "boolean" ? klass.is_published : klass.published) ?? false

    const modulesRaw = (klass.modules ?? []).map((mod) => {
      const rawIndex =
        typeof mod.index_in_class === "number" && Number.isFinite(mod.index_in_class)
          ? mod.index_in_class
          : typeof mod.idx === "number" && Number.isFinite(mod.idx)
            ? mod.idx
            : 1
      const modulePublished =
        (typeof mod.is_published === "boolean" ? mod.is_published : mod.published) ?? true

      return {
        id: mod.id,
        slug: mod.slug ?? (slugifyModuleTitle(mod.title) || mod.id),
        index: rawIndex ?? 1,
        title: mod.title,
        description: mod.description ?? null,
        published: modulePublished,
      } satisfies SidebarModule
    })

    const byIndex = new Map<number, SidebarModule>()
    for (const mod of modulesRaw) {
      const safeIndex = Number.isFinite(mod.index) && mod.index > 0 ? mod.index : 1
      if (!byIndex.has(safeIndex)) {
        byIndex.set(safeIndex, { ...mod, index: safeIndex })
      }
    }
    const deduped = Array.from(byIndex.values()).sort((a, b) => a.index - b.index)

    return {
      id: klass.id,
      slug: klass.slug,
      title: klass.slug === "electives" ? "Formation" : klass.title,
      description: ("description" in klass ? klass.description ?? null : null),
      published: classPublished,
      position: typeof klass.position === "number" ? klass.position : null,
      modules: deduped,
    }
  })

  const filtered = includeDrafts
    ? normalized
    : normalized
        .filter((klass) => klass.published)
        .map((klass) => ({
          ...klass,
          modules: klass.modules.filter((mod) => mod.published),
        }))

  const seenSlugs = new Set<string>()
  const uniqueBase = filtered.filter((klass) => {
    if (seenSlugs.has(klass.slug)) return false
    seenSlugs.add(klass.slug)
    return true
  })

  const unique = uniqueBase
    .filter((klass) => !/^session\s+\d+\s*[–-]\s*/i.test(klass.title))
    .filter((klass) => !/^session\s+[a-z]\d+\s*[–-]\s*/i.test(klass.title))
    .filter((klass) => !/^session-e\d+/i.test(klass.slug))
    .filter((klass) => (forceAdmin ? klass.modules.length > 0 : true))

  unique.sort((a, b) => {
    const pa = typeof a.position === "number" ? a.position : Number.MAX_SAFE_INTEGER
    const pb = typeof b.position === "number" ? b.position : Number.MAX_SAFE_INTEGER
    if (pa !== pb) return pa - pb
    return a.title.localeCompare(b.title)
  })

  return unique
}

const fetchPublishedSidebarTreeCached = unstable_cache(
  async (): Promise<SidebarClass[]> => {
    const admin = createSupabaseAdminClient()
    return fetchSidebarTreeUncached({
      includeDrafts: false,
      forceAdmin: false,
      clientOverride: admin,
    })
  },
  ["sidebar-tree-published-v1"],
  { revalidate: 30, tags: ["sidebar-tree"] },
)

/**
 * Cached for the common published-only learner path to reduce layout query cost
 * on route transitions. Admin/draft variants stay uncached.
 */
export async function fetchSidebarTree({
  includeDrafts,
  forceAdmin = false,
}: FetchSidebarOptions): Promise<SidebarClass[]> {
  if (!includeDrafts && !forceAdmin && env.SUPABASE_SERVICE_ROLE_KEY) {
    return fetchPublishedSidebarTreeCached()
  }
  return fetchSidebarTreeUncached({ includeDrafts, forceAdmin })
}
