import FolderOpen from "lucide-react/dist/esm/icons/folder-open"

import { Separator } from "@/components/ui/separator"

import { DeckResourceCard } from "../deck-resource-card"
import { ResourcesCard } from "../resources-card"
import type { ModuleResource } from "../types"

type ModuleStepperResourcesStepProps = {
  resources: ModuleResource[]
  moduleId: string
  hasDeck: boolean
}

export function ModuleStepperResourcesStep({
  resources,
  moduleId,
  hasDeck,
}: ModuleStepperResourcesStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-2 text-left sm:items-center sm:text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-muted/40 text-muted-foreground">
          <FolderOpen className="h-5 w-5" aria-hidden />
        </span>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">Resources</h3>
          <p className="text-xs text-muted-foreground">
            Links and downloads that support this lesson.
          </p>
        </div>
      </div>
      <Separator className="bg-border/60" />
      <ResourcesCard resources={resources}>
        <DeckResourceCard moduleId={moduleId} hasDeck={hasDeck} />
      </ResourcesCard>
    </div>
  )
}
