"use client"

import ChevronLeftIcon from "lucide-react/dist/esm/icons/chevron-left"
import ChevronRightIcon from "lucide-react/dist/esm/icons/chevron-right"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import type { OrgProgram } from "@/components/organization/org-profile-card/types"
import { Button } from "@/components/ui/button"
import type { CarouselApi } from "@/components/ui/carousel"
import {
  analyzeFiscalSponsorshipActivityEligibility,
  FiscalSponsorshipActivityAction,
  type FiscalSponsorshipActivityEligibility,
  type FiscalSponsorshipActivityEligibilityActivity,
} from "@/features/fiscal-sponsorship"

import { WORKSPACE_CARD_META } from "./workspace-board-copy"
import type { WorkspaceBoardNodeData } from "./workspace-board-node-types"
import {
  buildWorkspaceProgramEditorHref,
  isWorkspaceProgramsPreviewOnlyStep,
  resolveWorkspaceProgramsDisplayPrograms,
  WorkspaceBoardProgramsCard,
} from "./workspace-board-programs-card"
import { WorkspaceBoardNodeCardShell } from "./workspace-board-node-card-shell"
import type { WorkspaceCardSize } from "./workspace-board-types"

type WorkspaceProgramsDisplayProgram = OrgProgram

function getProgramField<K extends keyof WorkspaceProgramsDisplayProgram>(
  program: WorkspaceProgramsDisplayProgram | null,
  key: K
) {
  return program && key in program ? program[key] : null
}

function getProgramWizardSnapshot(
  program: WorkspaceProgramsDisplayProgram | null
) {
  const value = getProgramField(program, "wizard_snapshot")
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function readSnapshotString(
  snapshot: Record<string, unknown> | null,
  key: string
) {
  const value = snapshot?.[key]
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null
}

function buildEligibilityActivity(
  program: WorkspaceProgramsDisplayProgram | null
): FiscalSponsorshipActivityEligibilityActivity | null {
  if (!program) return null

  const wizardSnapshot = getProgramWizardSnapshot(program)

  return {
    title: program.title,
    subtitle: program.subtitle,
    description: program.description,
    location: getProgramField(program, "location"),
    locationType: getProgramField(program, "location_type"),
    addressCity: getProgramField(program, "address_city"),
    addressState: getProgramField(program, "address_state"),
    addressCountry: getProgramField(program, "address_country"),
    focusArea:
      readSnapshotString(wizardSnapshot, "programType") ??
      program.features?.[0] ??
      null,
    objectKind: readSnapshotString(wizardSnapshot, "objectKind"),
    estimatedBudgetCents: getProgramField(program, "goal_cents"),
    goalCents: getProgramField(program, "goal_cents"),
    wizardSnapshot,
  }
}

function renderProgramsHeaderAction({
  canEdit,
  eligibility,
  fiscalSponsorshipCardVisible,
  isCanvasFullscreen,
  onOpenFiscalSponsorship,
  onProgramsCreateOpenChange,
  onUpdateFiscalSponsorshipInfo,
  presentationMode,
  programsPreviewOnly,
}: {
  canEdit: boolean
  eligibility: FiscalSponsorshipActivityEligibility
  fiscalSponsorshipCardVisible: boolean
  isCanvasFullscreen: boolean
  onOpenFiscalSponsorship: () => void
  onProgramsCreateOpenChange: (open: boolean) => void
  onUpdateFiscalSponsorshipInfo: () => void
  presentationMode: boolean
  programsPreviewOnly: boolean
}) {
  const fiscalSponsorshipActionLabel = fiscalSponsorshipCardVisible
    ? "Close fiscal sponsorship tile"
    : eligibility.eligible
      ? "Open fiscal sponsorship tile"
      : "Fiscal sponsorship review readiness"
  const canOpenFiscalSponsorship =
    canEdit && !presentationMode && !isCanvasFullscreen && !programsPreviewOnly
  if (!canOpenFiscalSponsorship && !canEdit) return null

  return (
    <div className="flex items-center gap-1.5">
      {canOpenFiscalSponsorship ? (
        <FiscalSponsorshipActivityAction
          active={fiscalSponsorshipCardVisible}
          ariaLabel={fiscalSponsorshipActionLabel}
          disabled={programsPreviewOnly}
          eligibility={eligibility}
          onOpen={onOpenFiscalSponsorship}
          onUpdateInfo={onUpdateFiscalSponsorshipInfo}
        />
      ) : null}
      {canEdit ? (
        <Button
          type="button"
          size="sm"
          className="h-8 rounded-md px-3"
          disabled={programsPreviewOnly}
          onClick={() => onProgramsCreateOpenChange(true)}
        >
          Add
        </Button>
      ) : null}
    </div>
  )
}

function renderProgramsFooterAction({
  canScrollNext,
  canScrollPrevious,
  hasCarouselControls,
  onScrollNext,
  onScrollPrevious,
}: {
  canScrollNext: boolean
  canScrollPrevious: boolean
  hasCarouselControls: boolean
  onScrollNext: () => void
  onScrollPrevious: () => void
}) {
  if (!hasCarouselControls) return null

  return (
    <div className="flex w-full items-center justify-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="border-border/70 bg-background/85 h-8 w-8 rounded-full backdrop-blur-sm"
        disabled={!canScrollPrevious}
        aria-label="Previous activity"
        onClick={onScrollPrevious}
      >
        <ChevronLeftIcon aria-hidden />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="border-border/70 bg-background/85 h-8 w-8 rounded-full backdrop-blur-sm"
        disabled={!canScrollNext}
        aria-label="Next activity"
        onClick={onScrollNext}
      >
        <ChevronRightIcon aria-hidden />
      </Button>
    </div>
  )
}

export function WorkspaceBoardProgramsNodeCard({
  canEdit,
  cardMeta,
  contentClassName,
  data,
  effectiveCardSize,
  frameFullscreenToggle,
  hideHeaderSubtitle,
  isCanvasFullscreen,
  onProgramsCreateOpenChange,
  presentationMode,
  programsCreateOpen,
}: {
  canEdit: boolean
  cardMeta: (typeof WORKSPACE_CARD_META)["programs"]
  contentClassName: string | undefined
  data: WorkspaceBoardNodeData
  effectiveCardSize: WorkspaceCardSize
  frameFullscreenToggle?: () => void
  hideHeaderSubtitle: boolean
  isCanvasFullscreen: boolean
  onProgramsCreateOpenChange: (open: boolean) => void
  presentationMode: boolean
  programsCreateOpen: boolean
}) {
  const router = useRouter()
  const workspacePrograms = data.organizationEditorData?.programs
  const programs = useMemo(() => workspacePrograms ?? [], [workspacePrograms])
  const legacyProgramsValue =
    data.organizationEditorData?.initialProfile.programs
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null)
  const [canScrollPrevious, setCanScrollPrevious] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const [selectedProgramIndex, setSelectedProgramIndex] = useState(0)
  const programsPreviewOnly = isWorkspaceProgramsPreviewOnlyStep(
    data.tutorialStepId
  )
  const displayPrograms = useMemo(
    () =>
      resolveWorkspaceProgramsDisplayPrograms({
        programs,
        legacyProgramsValue,
      }) as WorkspaceProgramsDisplayProgram[],
    [legacyProgramsValue, programs]
  )
  const hasCarouselControls = displayPrograms.length > 1
  const selectedProgram =
    displayPrograms[
      Math.min(Math.max(selectedProgramIndex, 0), displayPrograms.length - 1)
    ] ??
    displayPrograms[0] ??
    null
  const fiscalSponsorshipEligibility = useMemo(
    () =>
      analyzeFiscalSponsorshipActivityEligibility({
        activity: buildEligibilityActivity(selectedProgram),
        organization: data.organizationEditorData?.initialProfile ?? null,
        prefill:
          data.organizationEditorData?.fiscalSponsorshipApplicationPrefill ??
          null,
      }),
    [
      data.organizationEditorData?.fiscalSponsorshipApplicationPrefill,
      data.organizationEditorData?.initialProfile,
      selectedProgram,
    ]
  )
  const updateFiscalSponsorshipInfoHref = buildWorkspaceProgramEditorHref(
    selectedProgram?.id?.startsWith("legacy-program-")
      ? undefined
      : selectedProgram?.id
  )

  useEffect(() => {
    if (displayPrograms.length <= 1) {
      setSelectedProgramIndex(0)
    }
  }, [displayPrograms.length])

  useEffect(() => {
    if (!hasCarouselControls || !carouselApi) {
      setCanScrollPrevious(false)
      setCanScrollNext(false)
      return
    }

    const updateCarouselState = () => {
      setCanScrollPrevious(carouselApi.canScrollPrev())
      setCanScrollNext(carouselApi.canScrollNext())
      setSelectedProgramIndex(carouselApi.selectedScrollSnap())
    }

    updateCarouselState()
    carouselApi.on("reInit", updateCarouselState)
    carouselApi.on("select", updateCarouselState)

    return () => {
      carouselApi.off("reInit", updateCarouselState)
      carouselApi.off("select", updateCarouselState)
    }
  }, [carouselApi, hasCarouselControls])

  return (
    <WorkspaceBoardNodeCardShell
      cardId="programs"
      title={cardMeta.title}
      subtitle={cardMeta.subtitle}
      hideSubtitle={hideHeaderSubtitle}
      headerAction={renderProgramsHeaderAction({
        canEdit,
        eligibility: fiscalSponsorshipEligibility,
        fiscalSponsorshipCardVisible:
          data.fiscalSponsorshipCardVisible === true,
        isCanvasFullscreen,
        onOpenFiscalSponsorship: () => data.onOpenCard?.("fiscal-sponsorship"),
        onProgramsCreateOpenChange,
        onUpdateFiscalSponsorshipInfo: () =>
          router.push(updateFiscalSponsorshipInfoHref),
        presentationMode,
        programsPreviewOnly,
      })}
      size={effectiveCardSize}
      presentationMode={presentationMode}
      fullHref={cardMeta.fullHref}
      canEdit={canEdit}
      shellInsetClassName="px-3 pt-3 pb-3"
      contentClassName={contentClassName}
      contentSurface="plain"
      editorHref={null}
      footer={renderProgramsFooterAction({
        canScrollNext,
        canScrollPrevious,
        hasCarouselControls,
        onScrollNext: () => carouselApi?.scrollNext(),
        onScrollPrevious: () => carouselApi?.scrollPrev(),
      })}
      footerClassName="justify-center px-3 pt-2 pb-3"
      isCanvasFullscreen={isCanvasFullscreen}
      onToggleCanvasFullscreen={frameFullscreenToggle}
    >
      <WorkspaceBoardProgramsCard
        programs={programs}
        legacyProgramsValue={legacyProgramsValue}
        canEdit={canEdit}
        createOpen={programsCreateOpen}
        onCreateOpenChange={onProgramsCreateOpenChange}
        onCarouselApiChange={setCarouselApi}
        previewOnly={programsPreviewOnly}
      />
    </WorkspaceBoardNodeCardShell>
  )
}
