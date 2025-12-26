"use client"

import Loader2 from "lucide-react/dist/esm/icons/loader-2"
import Pencil from "lucide-react/dist/esm/icons/pencil"
import { Button } from "@/components/ui/button"

type ProgressStats = {
  total: number
  completed: number
  currentIndex: number | null
}

interface ModuleHeaderProps {
  progress: ProgressStats
  title: string
  subtitle?: string
  isAdmin: boolean
  wizardError: string | null
  wizardLoading: boolean
  onEdit: () => void
}

export function ModuleHeader({
  progress,
  title,
  subtitle,
  isAdmin,
  wizardError,
  wizardLoading,
  onEdit,
}: ModuleHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 space-y-3">
        {(() => {
          const parts: string[] = []
          if (progress.currentIndex != null && progress.total > 0) {
            parts.push(`Module ${progress.currentIndex} of ${progress.total}`)
          }
          if (progress.total > 0) {
            parts.push(`${progress.completed}/${progress.total} completed`)
          }
          return parts.length > 0 ? (
            <p className="text-sm text-muted-foreground">{parts.join(" · ")}</p>
          ) : null
        })()}
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
        {subtitle ? <p className="max-w-3xl text-base text-muted-foreground">{subtitle}</p> : null}
      </div>
      {isAdmin ? (
        <div className="flex flex-col items-end gap-2">
          {wizardError ? <p className="text-xs text-rose-500">{wizardError}</p> : null}
          <Button
            size="sm"
            variant="outline"
            className="min-h-9 gap-2 shrink-0"
            onClick={onEdit}
            disabled={wizardLoading}
          >
            {wizardLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Pencil className="h-4 w-4" aria-hidden />
            )}
            <span>{wizardLoading ? "Loading…" : "Edit module"}</span>
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export function computeModuleProgress(
  modules: Array<{ id: string; assignmentSubmission?: { status?: string | null } | null }>,
  currentModuleId: string,
): ProgressStats {
  const total = modules.length
  const completed = modules.reduce((count, module) => {
    const status = module.assignmentSubmission?.status ?? null
    return status === "accepted" ? count + 1 : count
  }, 0)
  const currentIndex = modules.findIndex((module) => module.id === currentModuleId)
  return {
    total,
    completed,
    currentIndex: currentIndex >= 0 ? currentIndex + 1 : null,
  }
}
