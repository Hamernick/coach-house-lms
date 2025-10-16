"use client"

import { ClassOverview } from "./class-overview"
import type { ClassDef } from "./types"

export function TrainingShell({ classes, isAdmin = false }: { classes: ClassDef[]; isAdmin?: boolean }) {
  if (classes.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-card/60 p-6 text-sm text-muted-foreground rounded-lg border">
          No classes assigned yet. You’ll see your coursework here once an admin enrolls you.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {classes.map((klass) => (
        <ClassOverview key={klass.id} c={klass} isAdmin={isAdmin} />
      ))}
    </div>
  )
}
