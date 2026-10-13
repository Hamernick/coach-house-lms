import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { getProjectDetailsById } from "@/features/platform-admin-dashboard/upstream/lib/data/project-details"
import { ProjectTasksTab } from "@/features/platform-admin-dashboard/upstream/components/projects/ProjectTasksTab"
import { WorkstreamTab } from "@/features/platform-admin-dashboard/upstream/components/projects/WorkstreamTab"

const project = getProjectDetailsById("project-1")

describe("member workspace read-only task tab chrome", () => {
  it("hides reorder handles in the upstream tasks tab when reordering is disabled", () => {
    const markup = renderToStaticMarkup(
      React.createElement(ProjectTasksTab, {
        project,
        canReorder: false,
      }),
    )

    expect(markup).not.toContain('aria-label="Reorder task"')
    expect(markup).not.toContain("New Task")
  })

  it("hides reorder handles in the upstream workstream tab when reordering is disabled", () => {
    const markup = renderToStaticMarkup(
      React.createElement(WorkstreamTab, {
        workstreams: project.workstreams,
        canReorder: false,
      }),
    )

    expect(markup).not.toContain('aria-label="Reorder task"')
  })
})
