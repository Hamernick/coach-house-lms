"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AssetsFilesTab, NotesTab, TaskQuickCreateModal, type ProjectTask } from "@/features/platform-admin-dashboard"
import { resolveRoadmapSections } from "@/lib/roadmap"
import { ProjectDetailTabsList } from "./project-detail-tabs-list"
import { ProjectFiscalSponsorshipOption } from "./project-fiscal-sponsorship-option"
import { Tabs, TabsContent } from "@/features/platform-admin-dashboard"
import { OrganizationProgramsTab } from "./organization-programs-tab"
import { OrganizationCoreDocumentEditor } from "./organization-core-document-editor"

const mission = {
  ...resolveRoadmapSections({}).find((section) => section.id === "mission_vision_values")!,
  content: Array.from(
    { length: 70 },
    (_, index) =>
      `<p>Mission paragraph ${index + 1}: We help our community build a lasting future.</p>`
  ).join(""),
}

const vision = {
  ...resolveRoadmapSections({}).find((section) => section.id === "vision")!,
  content: mission.content.replaceAll("Mission", "Vision"),
}
const initialTask: ProjectTask = {
  id: "sample-task",
  name: "Review staff meeting structure",
  status: "todo",
  projectId: "sample",
  projectName: "Project Management Tool",
  workstreamId: "admin",
  workstreamName: "Admin",
  description: "Review our staff meeting structure.",
  priority: "high",
}

export function EditorInteractionPreview() {
  const [open, setOpen] = useState<"task" | "mission" | "vision" | null>(null)
  const [fiscalEnabled, setFiscalEnabled] = useState(false)
  const [projectTab, setProjectTab] = useState("overview")
  const [setupFiscal, setSetupFiscal] = useState(false)
  const [task, setTask] = useState(initialTask)
  const [saved, setSaved] = useState("")
  return (
    <main className="bg-background text-foreground p-6">
      <h1 className="text-xl font-semibold">Editor interaction review</h1>
      <p className="text-muted-foreground mb-4">
        Sample data only. Task, note and file saves stay local. Document scrolling and discard review only.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setOpen("task")}>Open task</Button>
        <Button onClick={() => setOpen("mission")}>Open Mission</Button>
        <Button onClick={() => setOpen("vision")}>Open Vision</Button>
      </div>
      <p role="status">{saved}</p>
      {/* Reproduce the shell's fixed-position containing block and long task list. */}
      <div data-testid="task-list-scroll" className="mt-4 h-96 overflow-y-auto border">
        <div
          className="relative h-[2800px]"
          style={{ transform: "translate3d(0, 0, 0)" }}
        >
          <TaskQuickCreateModal
            open={open === "task"}
            onClose={() => setOpen(null)}
            editingTask={task}
            projectOptions={[
              { id: "sample", label: "Project Management Tool" },
            ]}
            workstreamOptionsByProjectId={{
              sample: [{ id: "admin", label: "Admin" }],
            }}
            assigneeOptions={[{ id: "sample-person", name: "Sample reviewer" }]}
            onSubmitTask={async (value) => {
              setTask((current) => ({ ...current, name: value.title, status: value.status, description: value.description }))
              setSaved("Task saved")
              return { ok: true }
            }}
          />
        </div>
      </div>
      {open === "mission" || open === "vision" ? (
        <OrganizationCoreDocumentEditor
          section={open === "mission" ? mission : vision}
          organizationId="sample"
          userId="sample"
          onClose={() => setOpen(null)}
          onSaved={() => {}}
        />
      ) : null}
      <section aria-label="Project tab review" className="my-6 flex min-w-0 flex-col gap-4">
        <ProjectFiscalSponsorshipOption checked={setupFiscal} onChange={setSetupFiscal} />
        <Tabs value={projectTab} onValueChange={setProjectTab}>
          <ProjectDetailTabsList fiscalEnabled={fiscalEnabled} canAdd adding={false} onAddFiscal={() => { setFiscalEnabled(true); setProjectTab("fiscal-sponsorship") }} />
          <TabsContent value="overview">Sample project overview</TabsContent>
          {fiscalEnabled ? <TabsContent value="fiscal-sponsorship">Sample sponsorship tab added</TabsContent> : null}
        </Tabs>
      </section>
      <section aria-label="Organization programs review" className="my-6">
        <Tabs defaultValue="overview">
          <ProjectDetailTabsList hasPrograms fiscalEnabled={false} canAdd={false} adding={false} onAddFiscal={() => {}} />
          <TabsContent value="overview">Sample organization overview</TabsContent>
          <TabsContent value="programs">
            <OrganizationProgramsTab organizationId="00000000-0000-4000-8000-000000000099" organizationName="Sample organization"
              programs={[{ id: "00000000-0000-4000-8000-000000000098", title: "Community mentorship", description: "A sample private program for review.", is_public: false, wizard_snapshot: { objectKind: "Program" } }]} />
          </TabsContent>
        </Tabs>
      </section>
      <NotesTab
        notes={[]}
        projectId="sample"
        currentUser={{ id: "sample-person", name: "Sample reviewer" }}
        createNoteAction={async () => {
          setSaved("Note saved")
          return { ok: true, noteId: "sample-note" }
        }}
      />
      <AssetsFilesTab
        files={[]}
        onCreateAsset={async () => { setSaved("File saved") }}
      />
    </main>
  )
}
