import { AppBreadcrumbs } from "@/components/app-shell/breadcrumbs"

export default function InternalAdminBreadcrumbs() {
  return <AppBreadcrumbs segments={[{ label: "Staff Admin", href: "/internal" }, { label: "Overview" }]} />
}
