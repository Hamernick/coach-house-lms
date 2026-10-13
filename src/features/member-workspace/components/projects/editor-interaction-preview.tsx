"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { TaskQuickCreateModal } from "@/features/platform-admin-dashboard"
import { resolveRoadmapSections } from "@/lib/roadmap"
import { OrganizationCoreDocumentEditor } from "./organization-core-document-editor"

const mission = {
  ...resolveRoadmapSections({}).find((section) => section.id === "mission")!,
  content: Array.from(
    { length: 70 },
    (_, index) =>
      `<p>Mission paragraph ${index + 1}: We help our community build a lasting future.</p>`
  ).join(""),
}

export function EditorInteractionPreview() {
  const [open, setOpen] = useState<"task" | "document" | null>(null)
  const [saved, setSaved] = useState("")
  return (
    <main className="bg-background text-foreground p-6">
      <h1 className="text-xl font-semibold">Editor interaction review</h1>
      <p className="text-muted-foreground mb-4">
        Sample data only. Task saves here do not change live records.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setOpen("task")}>Open task</Button>
        <Button onClick={() => setOpen("document")}>Open Mission</Button>
      </div>
      <p role="status">{saved}</p>
      {/* Reproduce the shell's fixed-position containing block and long task list. */}
      <div className="mt-4 h-96 overflow-y-auto border">
        <div
          className="relative h-[2800px]"
          style={{ transform: "translate3d(0, 0, 0)" }}
        >
          <TaskQuickCreateModal
            open={open === "task"}
            onClose={() => setOpen(null)}
            editingTask={{
              id: "sample-task",
              name: "Review staff meeting structure",
              status: "todo",
              projectId: "sample",
              projectName: "Project Management Tool",
              workstreamId: "admin",
              workstreamName: "Admin",
              description: "Review our staff meeting structure.",
              priority: "high",
            }}
            projectOptions={[
              { id: "sample", label: "Project Management Tool" },
            ]}
            workstreamOptionsByProjectId={{
              sample: [{ id: "admin", label: "Admin" }],
            }}
            assigneeOptions={[]}
            onSubmitTask={async () => {
              setSaved("Task saved")
              return { ok: true }
            }}
          />
        </div>
      </div>
      {open === "document" ? (
        <OrganizationCoreDocumentEditor
          section={mission}
          organizationId="sample"
          userId="sample"
          onClose={() => setOpen(null)}
          onSaved={() => {}}
        />
      ) : null}
    </main>
  )
}
