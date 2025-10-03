"use client"

import { useMemo, useState } from "react"
import { ClassOverview } from "./class-overview"
import { ModuleDetail } from "./module-detail"
import type { ClassDef } from "./types"

export function TrainingShell({ classes }: { classes: ClassDef[] }) {
  const [activeClassId, setActiveClassId] = useState<string | null>(classes[0]?.id ?? null)
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null)

  const activeClass = useMemo(() => classes.find((c) => c.id === activeClassId) || null, [classes, activeClassId])
  const activeModule = useMemo(() => activeClass?.modules.find((m) => m.id === activeModuleId) || null, [activeClass, activeModuleId])

  const hasClasses = classes.length > 0

  return !hasClasses ? (
    <div className="space-y-6">
      <div className="bg-card/60 p-6 text-sm text-muted-foreground rounded-lg border">No classes assigned yet. You’ll see your coursework here once an admin enrolls you.</div>
    </div>
  ) : (
    <div className="space-y-6">
      {activeClass && !activeModule ? (
        <ClassOverview c={activeClass} onStartModule={(moduleId) => setActiveModuleId(moduleId)} />
      ) : null}
      {activeClass && activeModule ? <ModuleDetail c={activeClass} m={activeModule} /> : null}
    </div>
  )
}
