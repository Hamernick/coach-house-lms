"use client"

import * as React from "react"

import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import {
  FISCAL_SPONSORSHIP_PROJECT_DURATION_OPTIONS,
  type FiscalSponsorshipApplicationDraft,
} from "../lib/application-draft"
import type { FiscalSponsorshipProjectDurationType } from "../types"
import {
  DraftInputField,
  EMPTY_SELECT_VALUE,
  SelectField,
  type DraftFieldChange,
} from "./fiscal-sponsorship-application-editor-controls"

function ProjectDurationField({
  draft,
  onFieldChange,
}: {
  draft: FiscalSponsorshipApplicationDraft
  onFieldChange: DraftFieldChange
}) {
  return (
    <SelectField
      label="Project duration"
      value={draft.projectDurationType || EMPTY_SELECT_VALUE}
      placeholder="Choose duration..."
      options={[
        { value: EMPTY_SELECT_VALUE, label: "Not set" },
        ...FISCAL_SPONSORSHIP_PROJECT_DURATION_OPTIONS,
      ]}
      onValueChange={(value) => {
        const nextDuration =
          value === EMPTY_SELECT_VALUE
            ? ""
            : (value as FiscalSponsorshipProjectDurationType)

        onFieldChange("projectDurationType", nextDuration)

        if (nextDuration === "ongoing_multi_year") {
          onFieldChange("temporaryEndDate", "")
        }
      }}
    />
  )
}

function ProjectTimelineFields({
  draft,
  formId,
  onFieldChange,
}: {
  draft: FiscalSponsorshipApplicationDraft
  formId: string
  onFieldChange: DraftFieldChange
}) {
  const projectDurationType = draft.projectDurationType
  const [hasNoProposedEndDate, setHasNoProposedEndDate] = React.useState(
    draft.temporaryEndDate.length === 0
  )
  const endDateInputId = `${formId}-temporaryEndDate`
  const noEndDateInputId = `${formId}-temporaryEndDateUnknown`

  React.useEffect(() => {
    setHasNoProposedEndDate(draft.temporaryEndDate.length === 0)
  }, [draft.temporaryEndDate])

  if (!projectDurationType) {
    return (
      <Field>
        <FieldLabel>Timeline</FieldLabel>
        <FieldDescription>
          Choose a project duration to set the timeline fields.
        </FieldDescription>
      </Field>
    )
  }

  if (projectDurationType === "ongoing_multi_year") {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <DraftInputField
          formId={formId}
          field="temporaryStartDate"
          label="Launch or start date"
          type="date"
          value={draft.temporaryStartDate}
          onFieldChange={onFieldChange}
        />
        <Field className="rounded-lg border border-dashed p-3">
          <FieldLabel>No end date required</FieldLabel>
          <FieldDescription>
            Ongoing or multi-year projects can leave the end date open.
          </FieldDescription>
        </Field>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <DraftInputField
        formId={formId}
        field="temporaryStartDate"
        label="Start date"
        type="date"
        value={draft.temporaryStartDate}
        onFieldChange={onFieldChange}
      />
      <Field>
        <FieldLabel htmlFor={endDateInputId}>Proposed end date</FieldLabel>
        <Input
          id={endDateInputId}
          name="temporaryEndDate"
          type="date"
          value={draft.temporaryEndDate}
          disabled={hasNoProposedEndDate}
          onChange={(event) =>
            onFieldChange("temporaryEndDate", event.target.value)
          }
        />
        <Field orientation="horizontal" className="grid-cols-[auto_1fr] gap-2">
          <Checkbox
            id={noEndDateInputId}
            checked={hasNoProposedEndDate}
            onCheckedChange={(checked) => {
              const nextChecked = checked === true
              setHasNoProposedEndDate(nextChecked)
              if (nextChecked) onFieldChange("temporaryEndDate", "")
            }}
          />
          <FieldLabel
            htmlFor={noEndDateInputId}
            className="text-muted-foreground text-xs leading-snug font-normal"
          >
            No proposed end date yet
          </FieldLabel>
        </Field>
      </Field>
    </div>
  )
}

export function FiscalSponsorshipProjectTimelineFields({
  draft,
  formId,
  onFieldChange,
}: {
  draft: FiscalSponsorshipApplicationDraft
  formId: string
  onFieldChange: DraftFieldChange
}) {
  return (
    <>
      <ProjectDurationField draft={draft} onFieldChange={onFieldChange} />
      <ProjectTimelineFields
        draft={draft}
        formId={formId}
        onFieldChange={onFieldChange}
      />
    </>
  )
}
