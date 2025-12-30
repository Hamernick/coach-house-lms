"use client"

import { Fragment } from "react"
import FolderPlus from "lucide-react/dist/esm/icons/folder-plus"
import InfoIcon from "lucide-react/dist/esm/icons/info"

import { ProgramWizardLazy } from "@/components/programs/program-wizard-lazy"
import { ProgramCard } from "@/components/programs/program-card"
import { Empty } from "@/components/ui/empty"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

import type { OrgProgram } from "../types"
import { FormRow } from "@/components/organization/org-profile-card/shared"
import { dateRangeChip, locationSummary } from "../utils"
import { publicSharingEnabled } from "@/lib/feature-flags"

type ProgramsTabProps = {
  programs: OrgProgram[]
  companyName?: string | null
  editMode: boolean
  onProgramEdit: (program: OrgProgram) => void
}

export function ProgramsTab({ programs, companyName, editMode, onProgramEdit }: ProgramsTabProps) {
  const hasPrograms = programs && programs.length > 0
  const publicCopy = publicSharingEnabled
    ? "Programs appear in your overview and public page when published."
    : "Programs stay private until public sharing is enabled."

  return (
    <div className="grid gap-6">
      {editMode ? (
        <Fragment>
          <div className="grid gap-2 md:grid-cols-3">
            <div className="px-6 md:px-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-medium leading-none">Programs</h3>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition hover:text-foreground"
                      aria-label="Programs visibility info"
                    >
                      <InfoIcon className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">{publicCopy}</TooltipContent>
                </Tooltip>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Create and manage programs.</p>
            </div>
            <div className="md:col-span-2 flex items-center justify-end px-6 md:px-0">
              <ProgramWizardLazy />
            </div>
          </div>

          {hasPrograms ? (
            <div className="grid items-start justify-start gap-6" style={{ gridTemplateColumns: "repeat(auto-fit, 380px)" }}>
              {programs.map((program) => (
                <ProgramCard
                  key={program.id}
                  title={program.title ?? "Untitled program"}
                  org={companyName || undefined}
                  location={locationSummary(program) || undefined}
                  imageUrl={program.image_url || undefined}
                  statusLabel={program.status_label || undefined}
                  chips={[
                    dateRangeChip(program.start_date, program.end_date) || program.duration_label,
                    ...(Array.isArray(program.features) ? program.features : []),
                  ].filter(Boolean) as string[]}
                  goalCents={program.goal_cents || 0}
                  raisedCents={program.raised_cents || 0}
                  ctaLabel="Edit"
                  onCtaClick={() => onProgramEdit(program)}
                />
              ))}
            </div>
          ) : (
            <div className="px-6 md:px-0">
              <Empty
                icon={<FolderPlus className="h-5 w-5" />}
                title="No programs yet"
                description="Create your first program to showcase it here."
                actions={<ProgramWizardLazy />}
              />
            </div>
          )}
        </Fragment>
      ) : (
        <Fragment>
          <FormRow title="Programs">
            {hasPrograms ? (
              <div className="grid items-start justify-start gap-6" style={{ gridTemplateColumns: "repeat(auto-fit, 380px)" }}>
                {programs.map((program) => (
                  <ProgramCard
                    key={program.id}
                    title={program.title ?? "Untitled program"}
                    org={companyName || undefined}
                    location={locationSummary(program) || undefined}
                    imageUrl={program.image_url || undefined}
                    statusLabel={program.status_label || (program.is_public ? undefined : "Private") || undefined}
                    chips={[
                      dateRangeChip(program.start_date, program.end_date) || program.duration_label,
                      ...(Array.isArray(program.features) ? program.features : []),
                    ].filter(Boolean) as string[]}
                    goalCents={program.goal_cents || 0}
                    raisedCents={program.raised_cents || 0}
                    ctaLabel={program.cta_label || "Learn more"}
                    ctaHref={program.cta_url || undefined}
                  />
                ))}
              </div>
            ) : (
              <Empty
                icon={<FolderPlus className="h-5 w-5" />}
                title="No programs to display"
                description="Programs you create will appear here."
              />
            )}
          </FormRow>
        </Fragment>
      )}
    </div>
  )
}
