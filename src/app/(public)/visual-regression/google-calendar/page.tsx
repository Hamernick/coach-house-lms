import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { canAccessVisualRegressionRoute } from "@/lib/visual-regression-access"
import { RoadmapCalendarPreview } from "@/components/roadmap/roadmap-calendar-preview"
import { AppShellCalendarPreview } from "@/components/app-shell/components/app-shell-calendar-preview"
export default async function GoogleCalendarVisualPage({
  searchParams,
}: {
  searchParams: Promise<{ surface?: string }>
}) {
  if (!canAccessVisualRegressionRoute(await headers())) notFound()
  const { surface } = await searchParams
  return (
    <main className="bg-background min-h-screen p-4 sm:p-10">
      {surface === "shell" ? (
        <AppShellCalendarPreview />
      ) : (
        <RoadmapCalendarPreview />
      )}
    </main>
  )
}
