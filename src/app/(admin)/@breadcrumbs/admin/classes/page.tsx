import { DashboardBreadcrumbs } from "@/components/dashboard/breadcrumbs"

export default function AdminClassesCrumbs() {
  return <DashboardBreadcrumbs segments={[{ label: "Admin", href: "/admin" }, { label: "Classes" }]} />
}

