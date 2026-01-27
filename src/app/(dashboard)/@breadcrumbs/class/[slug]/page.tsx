import { AppBreadcrumbs } from "@/components/app-shell/breadcrumbs"
import { createSupabaseServerClient } from "@/lib/supabase"

export default async function ClassCrumbs({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from("classes")
    .select("title")
    .eq("slug", slug)
    .maybeSingle<{ title: string | null }>()
  const classTitle = data?.title ?? "Class"
  return <AppBreadcrumbs segments={[{ label: classTitle }]} />
}
