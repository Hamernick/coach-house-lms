import { AppBreadcrumbs } from "@/components/app-shell/breadcrumbs"

export default async function ElectiveCrumbs({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const label = slug.split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" ")
  return <AppBreadcrumbs segments={[{ label: "Academy", href: "/academy/electives" }, { label }]} />
}
