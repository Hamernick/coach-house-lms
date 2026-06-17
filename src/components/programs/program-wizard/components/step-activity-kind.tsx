import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  FieldDescription,
  FieldMessage,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field"
import { ORGANIZATION_PRIMARY_OBJECT_DEFINITIONS } from "@/lib/organization/primary-objects"
import { cn } from "@/lib/utils"

import type { ProgramWizardFormState } from "../schema"
import type { ProgramWizardFieldErrors, ProgramWizardUpdate } from "../types"

type StepActivityKindProps = {
  form: ProgramWizardFormState
  errors: ProgramWizardFieldErrors
  update: ProgramWizardUpdate
}

export function StepActivityKind({
  form,
  errors,
  update,
}: StepActivityKindProps) {
  return (
    <FieldSet className="gap-4">
      <div className="flex flex-col gap-1">
        <FieldLegend>What are you adding?</FieldLegend>
        <FieldDescription>
          Start with the activity category. The next steps only ask for the
          details needed to describe it clearly.
        </FieldDescription>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {ORGANIZATION_PRIMARY_OBJECT_DEFINITIONS.map((option) => {
          const selected = form.objectKind === option.kind

          return (
            <Button
              key={option.kind}
              type="button"
              variant="ghost"
              aria-pressed={selected}
              className={cn(
                "group bg-background hover:border-primary/50 hover:bg-background hover:text-foreground h-auto min-h-[4.75rem] w-full justify-start rounded-xl border border-transparent px-4 py-3 text-left transition-[background-color,border-color,color]",
                selected &&
                  "border-primary/40 bg-primary/10 text-foreground hover:bg-primary/10"
              )}
              onClick={() => update({ objectKind: option.kind })}
            >
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex min-w-0 items-center justify-between gap-3">
                  <span className="truncate text-sm font-medium">
                    {option.kind}
                  </span>
                  {selected ? (
                    <Badge
                      variant="secondary"
                      className="h-6 rounded-full px-2 text-[10px]"
                    >
                      Selected
                    </Badge>
                  ) : null}
                </span>
                <span className="text-muted-foreground text-xs leading-snug whitespace-normal">
                  {option.description}
                </span>
              </span>
            </Button>
          )
        })}
      </div>

      {errors.objectKind ? (
        <FieldMessage>{errors.objectKind}</FieldMessage>
      ) : null}
    </FieldSet>
  )
}
