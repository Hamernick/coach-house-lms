import { createSupabaseServerClient } from "@/lib/supabase/server"

export type ClassSummary = {
  id: string
  title: string
  slug: string
  description: string | null
  published: boolean
  moduleCount: number
  progressPercent: number
  createdAt: string
}

export type ListClassesResult = {
  items: ClassSummary[]
  total: number
  page: number
  pageSize: number
}

type ClassRowForList = {
  id: string
  title: string
  slug: string
  description: string | null
  is_published: boolean
  created_at: string
  modules?: { id: string }[] | null
}

const DEFAULT_PAGE_SIZE = 6

export async function listClasses({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
}: {
  page?: number
  pageSize?: number
} = {}): Promise<ListClassesResult> {
  const supabase = await createSupabaseServerClient()
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
  const size = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : DEFAULT_PAGE_SIZE
  const from = (safePage - 1) * size
  const to = from + size - 1

  const { data, error, count } = await supabase
    .from("classes")
    .select("id, title, slug, description, is_published, created_at, modules ( id )", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) {
    throw error
  }

  const items: ClassSummary[] = ((data ?? []) as ClassRowForList[]).map((row) => {
    const modules = row.modules ?? []
    const moduleCount = modules.length
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description ?? null,
      published: Boolean(row.is_published),
      moduleCount,
      progressPercent: moduleCount === 0 ? 0 : Math.min(100, moduleCount * 20),
      createdAt: row.created_at,
    }
  })

  return {
    items,
    total: count ?? items.length,
    page: safePage,
    pageSize: size,
  }
}

export async function getClassById(id: string) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("classes")
    .select("*, modules ( id, title, idx, slug, is_published, created_at, deck_path )")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}
