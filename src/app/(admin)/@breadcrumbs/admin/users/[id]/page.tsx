import { DashboardBreadcrumbs } from "@/components/dashboard/breadcrumbs"
import { requireAdmin } from "@/lib/admin/auth"

export default async function AdminUserDetailCrumbs({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdmin()
  const { id } = await params
  const { data } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", id)
    .maybeSingle<{ full_name: string | null; email: string | null }>()
  const label = data?.full_name ?? data?.email ?? id
  return (
    <DashboardBreadcrumbs
      segments={[{ label: "Admin", href: "/admin" }, { label: "People", href: "/admin/users" }, { label }]}
    />
  )
}

