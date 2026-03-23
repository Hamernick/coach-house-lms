import { AppBreadcrumbs } from "@/components/app-shell/breadcrumbs"

export default function AdminPlatformPrototypesBreadcrumbs() {
  return (
    <AppBreadcrumbs
      segments={[
        { label: "Admin", href: "/admin" },
        { label: "Platform", href: "/admin/platform" },
        { label: "Prototypes" },
      ]}
    />
  )
}
