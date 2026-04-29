"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import FolderPlusIcon from "lucide-react/dist/esm/icons/folder-plus"

import type { OrgProgram } from "@/components/organization/org-profile-card/types"
import {
  locationSummary,
  normalizeToList,
} from "@/components/organization/org-profile-card/utils"
import { ProgramCard } from "@/components/programs/program-card"
import { ProgramWizardLazy } from "@/components/programs/program-wizard-lazy"
import { Button } from "@/components/ui/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Empty } from "@/components/ui/empty"
import {
  resolveProgramBannerImageUrl,
  resolveProgramCardChips,
  resolveProgramProfileImageUrl,
  resolveProgramSummary,
} from "@/lib/programs/display"
import { getWorkspaceEditorPath } from "@/lib/workspace/routes"
import type { WorkspaceCanvasTutorialStepId } from "@/features/workspace-canvas-tutorial"

function sortProgramsByNewest(programs: OrgProgram[]) {
  return [...programs].sort((left, right) => {
    const leftCreatedAt = left.created_at ? Date.parse(left.created_at) : 0
    const rightCreatedAt = right.created_at ? Date.parse(right.created_at) : 0
    return rightCreatedAt - leftCreatedAt
  })
}

export function buildWorkspaceProgramEditorHref(programId?: string | null) {
  if (!programId || programId.trim().length === 0) {
    return getWorkspaceEditorPath({ tab: "programs" })
  }

  return getWorkspaceEditorPath({ tab: "programs", programId })
}

export function isWorkspaceProgramRecord(program: Pick<OrgProgram, "id">) {
  return Boolean(program.id && !program.id.startsWith("legacy-program-"))
}

export function isWorkspaceProgramsPreviewOnlyStep(
  tutorialStepId?: WorkspaceCanvasTutorialStepId | null,
) {
  return tutorialStepId === "programs"
}

export function resolveWorkspaceProgramsDisplayPrograms({
  programs,
  legacyProgramsValue,
}: {
  programs: OrgProgram[]
  legacyProgramsValue?: string | null
}) {
  if (programs.length > 0) return sortProgramsByNewest(programs)

  return normalizeToList(legacyProgramsValue).map((title, index) => ({
    id: `legacy-program-${index}`,
    title,
    status_label: "Configured",
  }))
}

export function WorkspaceBoardProgramsCard({
  programs,
  legacyProgramsValue,
  canEdit,
  createOpen,
  onCreateOpenChange,
  previewOnly = false,
}: {
  programs: OrgProgram[]
  legacyProgramsValue?: string | null
  canEdit: boolean
  createOpen: boolean
  onCreateOpenChange: (open: boolean) => void
  previewOnly?: boolean
}) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState<OrgProgram | null>(null)
  const sortedPrograms = useMemo(
    () =>
      resolveWorkspaceProgramsDisplayPrograms({
        programs,
        legacyProgramsValue,
      }),
    [legacyProgramsValue, programs],
  )

  const handleEditOpenChange = (open: boolean) => {
    setEditOpen(open)
    if (!open) {
      setSelectedProgram(null)
      router.refresh()
    }
  }

  const renderProgramCard = (program: OrgProgram) => {
    const useOverlay = canEdit && !previewOnly && isWorkspaceProgramRecord(program)
    const ctaHref = previewOnly
      ? undefined
      : useOverlay
        ? undefined
        : buildWorkspaceProgramEditorHref(program.id)
    const onCtaClick = useOverlay
      ? () => {
          setSelectedProgram(program)
          setEditOpen(true)
        }
      : undefined

    return (
      <ProgramCard
        title={program.title?.trim() || "Untitled program"}
        location={locationSummary(program) ?? undefined}
        description={resolveProgramSummary(program) ?? undefined}
        bannerImageUrl={resolveProgramBannerImageUrl(program) ?? undefined}
        imageUrl={resolveProgramProfileImageUrl(program) ?? undefined}
        statusLabel={program.status_label?.trim() || "Draft"}
        showStatusBadge={false}
        chips={resolveProgramCardChips(program)}
        goalCents={program.goal_cents || 0}
        raisedCents={program.raised_cents || 0}
        ctaLabel="Open"
        ctaHref={ctaHref}
        ctaTarget="_self"
        onCtaClick={onCtaClick}
        variant="medium"
        className="max-w-none border border-border/60 bg-background/35 shadow-none"
      />
    )
  }

  return (
    <>
      <div className="flex min-h-0 flex-col gap-3 pb-0.5">
        {sortedPrograms.length > 0 ? (
          sortedPrograms.length === 1 ? (
            <div key={sortedPrograms[0]?.id ?? sortedPrograms[0]?.title ?? "program-0"}>
              {renderProgramCard(sortedPrograms[0]!)}
            </div>
          ) : (
            <Carousel
              className="w-full"
              opts={{ align: "start", loop: sortedPrograms.length > 1 }}
            >
              <CarouselContent>
                {sortedPrograms.map((program, index) => (
                  <CarouselItem key={program.id ?? program.title ?? `program-${index}`}>
                    {renderProgramCard(program)}
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-auto right-[3.25rem] top-3 h-8 w-8 translate-y-0 rounded-full border-border/70 bg-background/85 backdrop-blur-sm" />
              <CarouselNext className="left-auto right-3 top-3 h-8 w-8 translate-y-0 rounded-full border-border/70 bg-background/85 backdrop-blur-sm" />
            </Carousel>
          )
        ) : (
          <Empty
            icon={<FolderPlusIcon className="h-5 w-5" aria-hidden />}
            title="No programs to display"
            description="Programs you create will appear here."
            actions={
              canEdit ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg px-3 text-xs"
                  disabled={previewOnly}
                  onClick={() => onCreateOpenChange(true)}
                >
                  Create program
                </Button>
              ) : (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg px-3 text-xs"
                >
                  <Link href={buildWorkspaceProgramEditorHref()}>
                    Open programs
                  </Link>
                </Button>
              )
            }
            size="sm"
            variant="subtle"
            className="min-h-[148px] rounded-xl px-4 py-6"
          />
        )}
      </div>

      {canEdit && !previewOnly ? (
        <ProgramWizardLazy
          mode="create"
          open={createOpen}
          onOpenChange={onCreateOpenChange}
        />
      ) : null}
      {selectedProgram && !previewOnly ? (
        <ProgramWizardLazy
          mode="edit"
          program={selectedProgram}
          open={editOpen}
          onOpenChange={handleEditOpenChange}
        />
      ) : null}
    </>
  )
}
