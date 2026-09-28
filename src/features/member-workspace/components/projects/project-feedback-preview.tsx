"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  ProjectWizard,
  type StepQuickCreateValue,
} from "@/features/platform-admin-dashboard"
import { projectDateToValue } from "@/lib/project-date"
import { ProjectRecurrenceSelect } from "./project-recurrence-select"
import { ProjectWizardDeleteAction } from "./project-wizard-delete-action"

const initial: StepQuickCreateValue = {
  title: "Demo — Monthly Finance",
  description: "Balance the checkbook and prepare the monthly report.",
  startDate: new Date(2026, 8, 24),
  targetDate: new Date(2026, 9, 18),
  statusId: "active",
  recurrence: "none",
  clientId: "demo",
}
const people = [{ id: "coach", name: "Demo Coach" }]
const organizations = [
  { id: "demo", name: "Coach House Demo", status: "active" as const },
]
const statuses = [
  { id: "active", label: "Active" },
  { id: "completed", label: "Completed" },
]

export function ProjectFeedbackPreview() {
  const [open, setOpen] = useState(true)
  const [value, setValue] = useState(initial)
  const [result, setResult] = useState("")
  return (
    <main className="bg-background text-foreground min-h-screen p-6">
      <h1 className="text-xl font-medium">Project Editor Preview</h1>
      <p className="text-muted-foreground mb-4 text-sm">
        Sample data only. Saving and deleting here do not change live records.
      </p>
      <Button onClick={() => setOpen(true)}>Open Project</Button>
      <p role="status" className="mt-4">
        {result}
      </p>
      {open ? (
        <ProjectWizard
          mode="edit"
          skipModeStep
          onClose={() => setOpen(false)}
          quickCreateInitialValue={value}
          quickCreateUsers={people}
          quickCreateClients={organizations}
          quickCreateStatuses={statuses}
          quickCreateRecurrenceControl={(recurrence, onChange) => (
            <ProjectRecurrenceSelect value={recurrence} onChange={onChange} />
          )}
          quickCreateFooterAction={
            <ProjectWizardDeleteAction
              projectId="demo"
              projectName={value.title}
              disabled={false}
              deleteProjectAction={async () => ({ ok: true, id: "demo" })}
              onDeleted={() => {
                setResult("Demo project deleted")
                setOpen(false)
              }}
            />
          }
          onQuickCreate={(next) => {
            setValue(next)
            setResult(
              `Saved due date: ${next.targetDate ? projectDateToValue(next.targetDate) : "none"}. Repeat: ${next.recurrence}.`
            )
            setOpen(false)
          }}
        />
      ) : null}
    </main>
  )
}
