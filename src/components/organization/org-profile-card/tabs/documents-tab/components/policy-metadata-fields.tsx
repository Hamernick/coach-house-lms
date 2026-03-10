"use client"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { DocumentsOption, PolicyDraft } from "../types"

type PolicyMetadataFieldsProps = {
  draft: PolicyDraft
  programOptions: DocumentsOption[]
  onChange: (nextDraft: PolicyDraft) => void
}

export function PolicyMetadataFields({
  draft,
  programOptions,
  onChange,
}: PolicyMetadataFieldsProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="grid gap-2">
        <Label>Status</Label>
        <Select
          value={draft.status}
          onValueChange={(value) =>
            onChange({
              ...draft,
              status: value as PolicyDraft["status"],
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="not_started">Not started</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="complete">Complete</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label>Program association</Label>
        <Select
          value={draft.programId || "none"}
          onValueChange={(value) =>
            onChange({ ...draft, programId: value === "none" ? "" : value })
          }
        >
          <SelectTrigger className="w-full min-w-0">
            <SelectValue placeholder="No program" className="line-clamp-1 text-left" />
          </SelectTrigger>
          <SelectContent
            align="start"
            sideOffset={6}
            className="w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]"
          >
            <SelectItem value="none">No program</SelectItem>
            {programOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                <span className="whitespace-normal break-words">{option.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
