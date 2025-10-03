import { DashboardBreadcrumbs } from "@/components/dashboard/breadcrumbs"

export default function AdminUsersCrumbs() {
  return <DashboardBreadcrumbs segments={[{ label: "Admin", href: "/admin" }, { label: "People" }]} />
}

