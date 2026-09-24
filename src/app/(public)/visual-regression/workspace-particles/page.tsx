import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { WorkspaceParticlesVisualFixture } from "@/features/workspace-particles/client"

export const metadata: Metadata = {
  title: "Workspace particles preview",
  robots: { index: false, follow: false },
}

export default function WorkspaceParticlesPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound()
  return <WorkspaceParticlesVisualFixture />
}
