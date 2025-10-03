import { DashboardBreadcrumbs } from "@/components/dashboard/breadcrumbs"
import { requireAdmin } from "@/lib/admin/auth"

export default async function AdminModuleDetailCrumbs({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdmin()
  const { id } = await params
  const { data } = await supabase
    .from("modules")
    .select("title, class_id, classes ( title )")
    .eq("id", id)
    .maybeSingle<{ title: string | null; class_id: string; classes: { title: string | null } | null }>()
  const classTitle = data?.classes?.title ?? "Classes"
  const moduleTitle = data?.title ?? "Module"
  return (
    <DashboardBreadcrumbs
      segments={[
        { label: "Admin", href: "/admin" },
        { label: "Classes", href: "/admin/classes" },
        { label: classTitle, href: data?.class_id ? `/admin/classes/${data.class_id}` : "/admin/classes" },
        { label: moduleTitle },
      ]}
    />
  )
}

