import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { canAccessVisualRegressionRoute } from "@/lib/visual-regression-access"
import { ProjectFeedbackPreview } from "@/features/member-workspace/client"

export default async function ProjectFeedbackPreviewPage() {
  if (!canAccessVisualRegressionRoute(await headers())) notFound()
  return <ProjectFeedbackPreview />
}
