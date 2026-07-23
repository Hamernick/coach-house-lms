import type { Metadata } from "next"
import { notFound } from "next/navigation"

import {
  WorkspaceOntologyBoardVisualFixture,
  WorkspaceOntologyVisualFixture,
} from "@/features/workspace-ontology"

export const metadata: Metadata = {
  title: "Workspace ontology visual fixture",
  robots: { index: false, follow: false },
}

export default function WorkspaceOntologyVisualFixturePage() {
  if (process.env.NODE_ENV === "production") notFound()
  return (
    <>
      <WorkspaceOntologyVisualFixture />
      <WorkspaceOntologyBoardVisualFixture />
    </>
  )
}
