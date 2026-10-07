"use client"

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
import { locationSummary } from "../utils"
import { publicSharingEnabled } from "@/lib/feature-flags"
import { ProgramsCarousel } from "./programs-carousel"

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

  const heading = (
    <div className="flex min-w-0 items-center gap-2">
      <h3 className="text-base leading-none font-medium">Activity</h3>
      {editMode ? (
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
          <TooltipContent className="max-w-xs">{publicCopy}</TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  )
  const introduction = editMode ? (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-muted-foreground min-w-0 flex-1 text-sm">
        Create and manage initiatives, projects, programs, events, and services.
      </p>
      <ProgramWizardLazy />
    </div>
  ) : null

  if (!hasPrograms) {
    return (
      <div className="grid gap-6">
        {heading}
        {introduction}
        <Empty
          icon={<FolderPlus className="h-5 w-5" />}
          title={editMode ? "No activity yet" : "No activity to display"}
          description={
            editMode
              ? "Create your first activity to showcase it here."
              : "Activity you create will appear here."
          }
          actions={editMode ? <ProgramWizardLazy /> : undefined}
        />
      </div>
    )
  }

  return (
    <ProgramsCarousel heading={heading} introduction={introduction}>
      {programs.map((program) => (
        <ProgramCard
          key={program.id}
          variant="medium"
          title={program.title ?? "Untitled activity"}
          org={companyName || undefined}
          location={locationSummary(program) || undefined}
          description={resolveProgramSummary(program) || undefined}
          bannerImageUrl={resolveProgramBannerImageUrl(program) || undefined}
          imageUrl={resolveProgramProfileImageUrl(program) || undefined}
          statusLabel={
            program.status_label ||
            (!editMode && !program.is_public ? "Private" : undefined)
          }
          chips={resolveProgramCardChips(program)}
          goalCents={program.goal_cents || 0}
          raisedCents={program.raised_cents || 0}
          ctaLabel={canEdit ? "Edit" : editMode ? "Edit" : program.cta_label || "Open"}
          ctaHref={canEdit || editMode ? undefined : program.cta_url || undefined}
          onCtaClick={
            editMode
              ? () => onProgramEdit(program)
              : canEdit ? () => onProgramEdit(program) : undefined
          }
        />
      ))}
    </ProgramsCarousel>
  )
}
