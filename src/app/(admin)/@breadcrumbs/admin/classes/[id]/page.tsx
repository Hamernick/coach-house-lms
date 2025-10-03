import { DashboardBreadcrumbs } from "@/components/dashboard/breadcrumbs"
import { requireAdmin } from "@/lib/admin/auth"

export default async function AdminClassDetailCrumbs({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdmin()
  const { id } = await params
  const { data } = await supabase
    .from("classes")
    .select("title")
    .eq("id", id)
    .maybeSingle<{ title: string | null }>()
  const title = data?.title ?? id
  return (
    <DashboardBreadcrumbs
      segments={[
        { label: "Admin", href: "/admin" },
        { label: "Classes", href: "/admin/classes" },
        { label: title },
      ]}
    />
  )
}
