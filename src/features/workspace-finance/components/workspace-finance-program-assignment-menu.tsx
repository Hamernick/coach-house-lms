"use client"

import { useTransition } from "react"
import { toast } from "sonner"

import { updateWorkspaceFinanceRecordProgram } from "@/actions/workspace-finance"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import type { WorkspaceFinanceRaisingProgram } from "../types"

const ORGANIZATION_WIDE_VALUE = "organization-wide"

export type WorkspaceFinanceProgramAssignment = {
  id: string
  title: string
} | null

export function WorkspaceFinanceProgramAssignmentMenu({
  onProgramChange,
  persist,
  programId,
  programTitle,
  programs,
  recordId,
}: {
  onProgramChange: (
    recordId: string,
    assignment: WorkspaceFinanceProgramAssignment
  ) => void
  persist: boolean
  programId: string | null
  programTitle: string | null
  programs: WorkspaceFinanceRaisingProgram[]
  recordId: string
}) {
  const [pending, startTransition] = useTransition()

  function updateProgram(value: string) {
    const nextProgram =
      value === ORGANIZATION_WIDE_VALUE
        ? null
        : (programs.find((program) => program.id === value) ?? null)
    const nextAssignment = nextProgram
      ? { id: nextProgram.id, title: nextProgram.title }
      : null

    if ((nextAssignment?.id ?? null) === programId) return

    const previousAssignment = programId
      ? { id: programId, title: programTitle ?? "Untitled program" }
      : null
    onProgramChange(recordId, nextAssignment)

    if (!persist) return

    startTransition(async () => {
      const result = await updateWorkspaceFinanceRecordProgram({
        recordId,
        programId: nextAssignment?.id ?? null,
      })

      if ("error" in result) {
        onProgramChange(recordId, previousAssignment)
        toast.error(result.error)
        return
      }

      toast.success("Program updated")
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-11 max-w-full justify-start rounded-md px-1.5 text-xs font-normal sm:h-7"
          aria-label={`Change program assignment${programTitle ? ` from ${programTitle}` : ""}`}
          aria-busy={pending}
          disabled={pending}
        >
          <span className="truncate">
            {programTitle ?? "Organization-wide"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Program</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={programId ?? ORGANIZATION_WIDE_VALUE}
            onValueChange={updateProgram}
          >
            <DropdownMenuRadioItem
              value={ORGANIZATION_WIDE_VALUE}
              className="py-3 sm:py-1.5"
            >
              Organization-wide
            </DropdownMenuRadioItem>
            {programs.map((program) => (
              <DropdownMenuRadioItem
                key={program.id}
                value={program.id}
                className="py-3 sm:py-1.5"
              >
                <span className="truncate">{program.title}</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
