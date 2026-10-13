"use client"

import { Fragment } from "react"
import FolderPlus from "lucide-react/dist/esm/icons/folder-plus"
import InfoIcon from "lucide-react/dist/esm/icons/info"

import { ProgramWizardLazy } from "@/components/programs/program-wizard-lazy"
import { ProgramCard } from "@/components/programs/program-card"
import { Button } from "@/components/ui/button"
import { Empty } from "@/components/ui/empty"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  resolveProgramBannerImageUrl,
  resolveProgramCardChips,
  resolveProgramProfileImageUrl,
  resolveProgramSummary,
} from "@/lib/programs/display"

import type { OrgProgram } from "../types"
import { FormRow } from "@/components/organization/org-profile-card/shared"
import { locationSummary } from "../utils"
import { publicSharingEnabled } from "@/lib/feature-flags"

type ProgramsTabProps = {
  programs: OrgProgram[]
  companyName?: string | null
  canEdit: boolean
  editMode: boolean
  onProgramEdit: (program: OrgProgram) => void
}

export function ProgramsTab({
  programs,
  companyName,
  canEdit,
  editMode,
  onProgramEdit,
}: ProgramsTabProps) {
  const hasPrograms = programs && programs.length > 0
  const publicCopy = publicSharingEnabled
    ? "Activity appears in your overview and public page when published."
    : "Activity stays private until public sharing is enabled."

  return (
    <div className="grid gap-6">
      {editMode ? (
        <Fragment>
          <div className="grid gap-2 md:grid-cols-3">
            <div className="px-6 md:px-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base leading-none font-medium">Activity</h3>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="border-border/70 text-muted-foreground hover:text-foreground h-5 w-5 rounded-full border p-0 hover:bg-transparent"
                      aria-label="Activity visibility info"
                    >
                      <InfoIcon className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    {publicCopy}
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-muted-foreground mt-1 text-sm">
                Create and manage initiatives, projects, programs, events, and
                services.
              </p>
            </div>
            <div className="flex items-center justify-end px-6 md:col-span-2 md:px-0">
              <ProgramWizardLazy />
            </div>
          </div>

          {hasPrograms ? (
            <div
              className="grid items-start justify-start gap-6"
              style={{ gridTemplateColumns: "repeat(auto-fit, 380px)" }}
            >
              {programs.map((program) => (
                <ProgramCard
                  key={program.id}
                  variant="medium"
                  title={program.title ?? "Untitled activity"}
                  org={companyName || undefined}
                  location={locationSummary(program) || undefined}
                  description={resolveProgramSummary(program) || undefined}
                  bannerImageUrl={
                    resolveProgramBannerImageUrl(program) || undefined
                  }
                  imageUrl={resolveProgramProfileImageUrl(program) || undefined}
                  statusLabel={program.status_label || undefined}
                  chips={resolveProgramCardChips(program)}
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
                title="No activity yet"
                description="Create your first activity to showcase it here."
                actions={<ProgramWizardLazy />}
              />
            </div>
          )}
        </Fragment>
      ) : (
        <Fragment>
          <FormRow title="Activity">
            {hasPrograms ? (
              <div
                className="grid items-start justify-start gap-6"
                style={{ gridTemplateColumns: "repeat(auto-fit, 380px)" }}
              >
                {programs.map((program) => (
                  <ProgramCard
                    key={program.id}
                    variant="medium"
                    title={program.title ?? "Untitled activity"}
                    org={companyName || undefined}
                    location={locationSummary(program) || undefined}
                    description={resolveProgramSummary(program) || undefined}
                    bannerImageUrl={
                      resolveProgramBannerImageUrl(program) || undefined
                    }
                    imageUrl={
                      resolveProgramProfileImageUrl(program) || undefined
                    }
                    statusLabel={
                      program.status_label ||
                      (program.is_public ? undefined : "Private") ||
                      undefined
                    }
                    chips={resolveProgramCardChips(program)}
                    goalCents={program.goal_cents || 0}
                    raisedCents={program.raised_cents || 0}
                    ctaLabel={canEdit ? "Edit" : program.cta_label || "Open"}
                    ctaHref={canEdit ? undefined : program.cta_url || undefined}
                    onCtaClick={
                      canEdit ? () => onProgramEdit(program) : undefined
                    }
                  />
                ))}
              </div>
            ) : (
              <Empty
                icon={<FolderPlus className="h-5 w-5" />}
                title="No activity to display"
                description="Activity you create will appear here."
              />
            )}
          </FormRow>
        </Fragment>
      )}
    </div>
  )
}
