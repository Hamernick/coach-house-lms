import { StrategicRoadmapEditorPage } from "@/components/roadmap/strategic-roadmap-editor-page"
import { PageTutorialButton } from "@/components/tutorial/page-tutorial-button"

export const dynamic = "force-dynamic"

export default async function MyOrganizationRoadmapPage() {
  return (
    <>
      <PageTutorialButton tutorial="roadmap" />
      <StrategicRoadmapEditorPage redirectTo="/my-organization/roadmap" />
    </>
  )
}
