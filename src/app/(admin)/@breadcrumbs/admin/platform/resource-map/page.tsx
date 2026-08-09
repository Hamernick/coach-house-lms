import { AppBreadcrumbs } from "@/components/app-shell/breadcrumbs"

export default function AdminPlatformResourceMapBreadcrumbs() {
  return (
    <AppBreadcrumbs
      segments={[
        { label: "Admin", href: "/admin" },
        { label: "Platform", href: "/admin/platform" },
        { label: "Resource Map Review" },
      ]}
    />
  )
}
