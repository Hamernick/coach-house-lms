"use client"

import type { ChangeEvent } from "react"
import FileText from "lucide-react/dist/esm/icons/file-text"

import { Textarea } from "@/components/ui/textarea"
import { Empty } from "@/components/ui/empty"

import type { OrgProfileErrors } from "../types"
import { FormRow, FieldText } from "@/components/organization/org-profile-card/shared"

type ReportsTabProps = {
  editMode: boolean
  reports?: string | null
  errors: OrgProfileErrors
  onInputChange: (event: ChangeEvent<HTMLTextAreaElement>) => void
}

export function ReportsTab({ editMode, reports, errors, onInputChange }: ReportsTabProps) {
  if (editMode) {
    return (
      <div className="grid gap-6">
        <FormRow title="Reports">
          <div className="grid gap-4">
            <Textarea
              name="reports"
              value={reports ?? ""}
              onChange={onInputChange}
              rows={3}
              aria-invalid={Boolean(errors.reports)}
            />
            {errors.reports ? <p className="text-xs text-destructive">{errors.reports}</p> : null}
          </div>
        </FormRow>
      </div>
    )
  }

  return reports && reports.trim() ? (
    <div className="grid gap-6">
      <FormRow title="Reports">
        <FieldText text={reports} multiline />
      </FormRow>
    </div>
  ) : (
    <Empty
      icon={<FileText className="h-5 w-5" />}
      title="No reports yet"
      description="Reports will appear here when added in Settings."
    />
  )
}
