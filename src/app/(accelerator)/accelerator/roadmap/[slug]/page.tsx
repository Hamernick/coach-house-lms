import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

type AcceleratorRoadmapSectionPageProps = {
  params: Promise<{ slug: string }>
}

export default async function AcceleratorRoadmapSectionPage({
  params,
}: AcceleratorRoadmapSectionPageProps) {
  const { slug } = await params
  redirect(`/workspace/roadmap/${slug}`)
}
