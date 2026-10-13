import { StrategicRoadmapEditorPage } from "@/components/roadmap/strategic-roadmap-editor-page"
import { PageTutorialButton } from "@/components/tutorial/page-tutorial-button"

export const dynamic = "force-dynamic"

type RoadmapSectionPageProps = {
  params: Promise<{ slug: string }>
}

export default async function RoadmapSectionPage({ params }: RoadmapSectionPageProps) {
  const { slug } = await params
  return (
    <>
      <PageTutorialButton tutorial="roadmap" />
      <StrategicRoadmapEditorPage redirectTo={`/roadmap/${slug}`} initialSectionSlug={slug} />
    </>
  )
}
