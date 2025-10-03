import { DashboardBreadcrumbs } from "@/components/dashboard/breadcrumbs"

export default async function AcademyModuleCrumbs({ params }: { params: Promise<{ section: string; index: string }> }) {
  const { section, index } = await params
  const sectionTitle = section.replace(/-/g, ' ').replace(/\b\w/g, (s) => s.toUpperCase())
  const n = parseInt(index, 10)
  return (
    <DashboardBreadcrumbs
      segments={[
        { label: "Academy", href: "/academy/overview" },
        { label: sectionTitle, href: `/academy/${section}` },
        { label: Number.isFinite(n) ? `Module ${n}` : 'Module' },
      ]}
    />
  )
}

