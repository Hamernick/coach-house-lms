import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { WorkspaceReactFlowErrorBootstrapFixture } from "./fixture"

export const metadata: Metadata = {
  title: "Workspace React Flow error bootstrap fixture",
  robots: { index: false, follow: false },
}

export default function WorkspaceReactFlowErrorBootstrapFixturePage() {
  if (process.env.NODE_ENV === "production") notFound()

  return <WorkspaceReactFlowErrorBootstrapFixture />
}
