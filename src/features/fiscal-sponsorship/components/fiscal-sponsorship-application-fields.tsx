"use client"

import FileTextIcon from "lucide-react/dist/esm/icons/file-text"

import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import { FISCAL_SPONSORSHIP_MISSING_APPLICATION_SECTIONS } from "../lib/application-data"
import type { FiscalSponsorshipProgramOption } from "../types"

function MissingDataChecklist() {
  return (
    <FieldSet className="bg-muted/35 rounded-2xl border p-3">
      <FieldLegend className="px-1">Information still needed</FieldLegend>
      <div className="mt-3 flex flex-col gap-3">
        {FISCAL_SPONSORSHIP_MISSING_APPLICATION_SECTIONS.map((section) => (
          <div key={section.id} className="bg-background rounded-xl border p-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="bg-primary/10 text-primary mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full">
                <FileTextIcon className="size-3.5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{section.title}</p>
                <p className="text-muted-foreground mt-1 text-xs leading-snug">
                  {section.description}
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {section.fields.map((field) => (
                    <label
                      key={field}
                      className="text-muted-foreground flex min-w-0 items-start gap-2 text-xs leading-snug"
                    >
                      <Checkbox className="mt-0.5" />
                      <span>{field}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </FieldSet>
  )
}

export function FiscalSponsorshipApplicationFields({
  programs = [],
}: {
  programs?: FiscalSponsorshipProgramOption[]
}) {
  return (
    <div className="flex flex-col gap-4">
      <FieldGroup>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="fs-applicant-first-name">
              First name
            </FieldLabel>
            <Input
              id="fs-applicant-first-name"
              placeholder="Applicant first name"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="fs-applicant-last-name">Last name</FieldLabel>
            <Input
              id="fs-applicant-last-name"
              placeholder="Applicant last name"
            />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="fs-project-name">
            Project, program, or initiative name
          </FieldLabel>
          <Input
            id="fs-project-name"
            placeholder="Choose or confirm the program record"
            defaultValue={programs[0]?.title ?? ""}
          />
          <FieldDescription>
            This should be the same project name used for the public profile,
            agreement, disclosure language, and grant requests.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel>Legal structure</FieldLabel>
          <ToggleGroup
            type="single"
            defaultValue="informal-group"
            className="bg-muted grid w-full grid-cols-2 rounded-xl p-1 sm:grid-cols-3"
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="individual" className="rounded-lg">
              Individual
            </ToggleGroupItem>
            <ToggleGroupItem value="informal-group" className="rounded-lg">
              Informal group
            </ToggleGroupItem>
            <ToggleGroupItem value="llc" className="rounded-lg">
              LLC
            </ToggleGroupItem>
            <ToggleGroupItem value="corporation" className="rounded-lg">
              Corporation
            </ToggleGroupItem>
            <ToggleGroupItem value="partnership" className="rounded-lg">
              Partnership
            </ToggleGroupItem>
          </ToggleGroup>
          <FieldDescription>
            Every approved project needs a U.S. tax reporting identity before
            Coach House can issue grant payments.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="fs-project-focus">
            Issue or focus area
          </FieldLabel>
          <Input
            id="fs-project-focus"
            placeholder="Community development, education, health, arts..."
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="fs-project-overview">
            Project description
          </FieldLabel>
          <Textarea
            id="fs-project-overview"
            defaultValue={programs[0]?.description ?? ""}
            placeholder="What are you doing, how does it work, and why does it matter?"
            className="min-h-24 resize-none"
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="fs-estimated-budget">
              Estimated budget
            </FieldLabel>
            <Input id="fs-estimated-budget" placeholder="$0" />
          </Field>
          <Field>
            <FieldLabel htmlFor="fs-date-range">Date range</FieldLabel>
            <Input id="fs-date-range" placeholder="Ongoing or date range" />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="fs-public-benefit">
            Public benefit and community impact
          </FieldLabel>
          <Textarea
            id="fs-public-benefit"
            placeholder="Who will benefit from this work, and how?"
            className="min-h-20 resize-none"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="fs-compliance-concerns">
            Legal, compliance, or financial concerns
          </FieldLabel>
          <Textarea
            id="fs-compliance-concerns"
            placeholder="Explain any known concerns, or write none."
            className="min-h-20 resize-none"
          />
        </Field>
      </FieldGroup>
      <MissingDataChecklist />
    </div>
  )
}
