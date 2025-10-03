import { DashboardBreadcrumbs } from "@/components/dashboard/breadcrumbs"

export default async function AcademySectionCrumbs({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  const label = section.replace(/-/g, ' ').replace(/\b\w/g, (s) => s.toUpperCase())
  return <DashboardBreadcrumbs segments={[{ label: "Academy", href: "/academy/overview" }, { label }]} />
}
