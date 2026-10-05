import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { canAccessVisualRegressionRoute } from "@/lib/visual-regression-access"
import {
  EditorInteractionPreview,
  ProjectFeedbackPreview,
} from "@/features/member-workspace/client"

export default async function ProjectFeedbackPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ scenario?: string }>
}) {
  if (!canAccessVisualRegressionRoute(await headers())) notFound()
  if ((await searchParams).scenario === "editors")
    return <EditorInteractionPreview />
  return <ProjectFeedbackPreview />
}
