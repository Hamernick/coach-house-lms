import { DashboardBreadcrumbs } from "@/components/dashboard/breadcrumbs"
import { createSupabaseServerClient } from "@/lib/supabase"

export default async function ModuleCrumbs({ params }: { params: Promise<{ slug: string; index: string }> }) {
  const { slug, index } = await params
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from("classes")
    .select("title")
    .eq("slug", slug)
    .maybeSingle<{ title: string | null }>()
  const classTitle = data?.title ?? "Class"
  const idx = Number.parseInt(index, 10)
  return <DashboardBreadcrumbs segments={[{ label: classTitle, href: `/class/${slug}/module/1` }, { label: Number.isFinite(idx) ? `Module ${idx}` : "Module" }]} />
}
