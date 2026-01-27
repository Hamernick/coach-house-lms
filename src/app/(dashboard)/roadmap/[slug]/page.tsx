import { StrategicRoadmapEditorPage } from "@/components/roadmap/strategic-roadmap-editor-page"
import { PageTutorialButton } from "@/components/tutorial/page-tutorial-button"

export const dynamic = "force-dynamic"

type RoadmapSectionPageProps = {
  params: { slug: string }
}

export default async function RoadmapSectionPage({ params }: RoadmapSectionPageProps) {
  const slug = params.slug
  return (
    <>
      <PageTutorialButton tutorial="roadmap" />
      <StrategicRoadmapEditorPage redirectTo={`/roadmap/${slug}`} initialSectionSlug={slug} />
    </>
  )
}
