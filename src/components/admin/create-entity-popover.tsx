"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import Plus from "lucide-react/dist/esm/icons/plus"
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left"

import { LessonCreationWizard } from "@/components/admin/lesson-creation-wizard"
import { createModuleAction } from "@/app/(admin)/admin/classes/[id]/actions"
import { createClassWizardAction } from "@/app/(admin)/admin/classes/actions"

type ClassLite = { id: string; title: string }

export function CreateEntityPopover({ classes }: { classes: ClassLite[] }) {
  const [open, setOpen] = useState(false)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [mode, setMode] = useState<"root" | "module">("root")

  const handleOpenChange = (value: boolean) => {
    setOpen(value)
    if (!value) {
      setMode("root")
    }
  }

  return (
    <>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Create"
            title="Create"
            className="h-7 w-7 rounded-md border-0 bg-transparent hover:bg-sidebar-accent data-[state=open]:bg-sidebar-accent"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 p-2">
          {mode === "root" ? (
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  setWizardOpen(true)
                  setOpen(false)
                }}
              >
                Add class
              </Button>
              {classes.length > 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setMode("module")}
                >
                  Add module
                </Button>
              ) : null}
            </div>
          ) : null}
          {mode === "module" ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  aria-label="Back"
                  onClick={() => setMode("root")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-medium">Select class</div>
              </div>
              <ScrollArea className="h-56">
                <div className="flex flex-col">
                  {classes.map((c) => (
                    <form
                      key={c.id}
                      action={createModuleAction}
                      className="contents"
                      onSubmit={() => setOpen(false)}
                    >
                      <input type="hidden" name="classId" value={c.id} />
                      <Button type="submit" variant="ghost" size="sm" className="w-full justify-start">
                        {c.title}
                      </Button>
                    </form>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ) : null}
        </PopoverContent>
      </Popover>
      <LessonCreationWizard
        open={wizardOpen}
        mode="create"
        onOpenChange={(value) => {
          setWizardOpen(value)
          if (!value) {
            setMode("root")
          }
        }}
        onSubmit={createClassWizardAction}
      />
    </>
  )
}
