import { AppBreadcrumbs } from "@/components/app-shell/breadcrumbs"

export default function AdminRootCrumbs() {
  return <AppBreadcrumbs segments={[{ label: "Admin", href: "/admin" }, { label: "Organization access" }]} />
}
