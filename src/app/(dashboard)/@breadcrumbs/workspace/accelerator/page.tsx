import { AppBreadcrumbs } from "@/components/app-shell/breadcrumbs"

export default function WorkspaceAcceleratorBreadcrumbPage() {
  return <AppBreadcrumbs segments={[{ label: "Workspace", href: "/workspace" }, { label: "Accelerator" }]} />
}
