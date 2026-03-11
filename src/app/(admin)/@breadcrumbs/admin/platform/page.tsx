import { AppBreadcrumbs } from "@/components/app-shell/breadcrumbs"

export default function AdminPlatformBreadcrumbs() {
  return <AppBreadcrumbs segments={[{ label: "Admin", href: "/admin" }, { label: "Platform" }]} />
}
