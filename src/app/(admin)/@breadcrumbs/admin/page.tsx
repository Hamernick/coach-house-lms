import { DashboardBreadcrumbs } from "@/components/dashboard/breadcrumbs"

export default function AdminRootCrumbs() {
  return <DashboardBreadcrumbs segments={[{ label: "Admin" }, { label: "Dashboard" }]} />
}

