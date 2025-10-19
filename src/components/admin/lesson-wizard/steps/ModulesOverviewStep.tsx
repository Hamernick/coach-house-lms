"use client"

import { Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { memo } from "react"

type ModuleItem = {
  id: string
  title: string
  resources: unknown[]
  formFields: unknown[]
}

function ModulesOverviewStepBase({
  modules,
  isEditMode,
  onAdd,
  onRemove,
  addDisabled = false,
}: {
  modules: ModuleItem[]
  isEditMode: boolean
  onAdd?: () => void
  onRemove: (index: number) => void
  addDisabled?: boolean
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="mb-1 text-lg font-semibold text-foreground">Lesson Modules</h3>
          <p className="text-sm text-muted-foreground">
            Each module is a sub-page with content, media, resources, and homework prompts.
          </p>
        </div>
        {onAdd ? (
          <Button type="button" size="sm" onClick={onAdd} disabled={addDisabled}>
            <Plus className="mr-2 h-4 w-4" />
            Add module
          </Button>
        ) : null}
      </div>

      <div className="space-y-3">
        {modules.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No modules yet. {onAdd ? "Add your first module to start structuring the lesson." : "Module creation is disabled in this mode."}
          </div>
        ) : (
          modules.map((moduleItem, index) => (
            <Card key={moduleItem.id} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-foreground">
                    Module {index + 1}: {moduleItem.title || "Untitled Module"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {moduleItem.resources.length} resources • {moduleItem.formFields.length} homework fields
                  </p>
                </div>
                {!isEditMode ? (
                  <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </Card>
          ))
        )}

        {!isEditMode && onAdd ? (
          <Button type="button" variant="outline" className="w-full bg-transparent" onClick={onAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add module
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export const ModulesOverviewStep = memo(ModulesOverviewStepBase)
