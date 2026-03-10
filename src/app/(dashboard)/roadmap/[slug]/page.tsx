import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

type RoadmapSectionPageProps = {
  params: Promise<{ slug: string }>
}

export default async function RoadmapSectionPage({ params }: RoadmapSectionPageProps) {
  const { slug } = await params
  redirect(`/workspace/roadmap/${slug}`)
}
