import { StrategicRoadmapEditorPage } from "@/components/roadmap/strategic-roadmap-editor-page"

export const dynamic = "force-dynamic"

export default async function MyOrganizationRoadmapPage() {
  return <StrategicRoadmapEditorPage redirectTo="/my-organization/roadmap" />
}
