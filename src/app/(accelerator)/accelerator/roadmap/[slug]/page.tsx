import { StrategicRoadmapEditorPage } from "@/components/roadmap/strategic-roadmap-editor-page"

export const dynamic = "force-dynamic"

type AcceleratorRoadmapSectionPageProps = {
  params: { slug: string }
}

export default async function AcceleratorRoadmapSectionPage({ params }: AcceleratorRoadmapSectionPageProps) {
  const slug = params.slug
  return <StrategicRoadmapEditorPage redirectTo={`/accelerator/roadmap/${slug}`} initialSectionSlug={slug} />
}
