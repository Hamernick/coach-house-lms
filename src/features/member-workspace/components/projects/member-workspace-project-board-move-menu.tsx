"use client"

import { DotsThreeVertical } from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function MemberWorkspaceProjectBoardMoveMenu({
  columns,
  moveProject,
  pending,
  projectId,
}: {
  columns: Array<{ id: string; label: string }>
  moveProject: (projectId: string, columnId: string) => void
  pending: boolean
  projectId: string
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 rounded-lg"
          disabled={pending}
          type="button"
          aria-label="Move project"
        >
          <DotsThreeVertical className="size-4" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-2" align="end">
        <div className="space-y-1">
          {columns.map((column) => (
            <button
              key={column.id}
              type="button"
              className="hover:bg-accent min-h-11 w-full rounded-md px-2 py-1 text-left text-sm"
              onClick={() => moveProject(projectId, column.id)}
            >
              Move to {column.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
