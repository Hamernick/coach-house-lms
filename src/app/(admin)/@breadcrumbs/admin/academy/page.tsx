import { DashboardBreadcrumbs } from "@/components/dashboard/breadcrumbs"

export default function AdminAcademyCrumbs() {
  return <DashboardBreadcrumbs segments={[{ label: "Admin", href: "/admin/academy" }, { label: "Academy" }]} />
}
