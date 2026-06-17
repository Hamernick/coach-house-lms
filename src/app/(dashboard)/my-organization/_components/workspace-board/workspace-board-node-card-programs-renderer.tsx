"use client"

import ChevronLeftIcon from "lucide-react/dist/esm/icons/chevron-left"
import ChevronRightIcon from "lucide-react/dist/esm/icons/chevron-right"
import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import type { CarouselApi } from "@/components/ui/carousel"
import { FiscalSponsorshipMark } from "@/features/fiscal-sponsorship"

import { WORKSPACE_CARD_META } from "./workspace-board-copy"
import type { WorkspaceBoardNodeData } from "./workspace-board-node-types"
import {
  isWorkspaceProgramsPreviewOnlyStep,
  resolveWorkspaceProgramsDisplayPrograms,
  WorkspaceBoardProgramsCard,
} from "./workspace-board-programs-card"
import { WorkspaceBoardNodeCardShell } from "./workspace-board-node-card-shell"
import type { WorkspaceCardSize } from "./workspace-board-types"

function renderProgramsHeaderAction({
  canEdit,
  canScrollNext,
  canScrollPrevious,
  fiscalSponsorshipCardVisible,
  hasCarouselControls,
  isCanvasFullscreen,
  onOpenFiscalSponsorship,
  onScrollNext,
  onScrollPrevious,
  presentationMode,
  programsPreviewOnly,
}: {
  canEdit: boolean
  canScrollNext: boolean
  canScrollPrevious: boolean
  fiscalSponsorshipCardVisible: boolean
  hasCarouselControls: boolean
  isCanvasFullscreen: boolean
  onOpenFiscalSponsorship: () => void
  onScrollNext: () => void
  onScrollPrevious: () => void
  presentationMode: boolean
  programsPreviewOnly: boolean
}) {
  const fiscalSponsorshipActionLabel = fiscalSponsorshipCardVisible
    ? "Close fiscal sponsorship tile"
    : "Open fiscal sponsorship tile"
  const canOpenFiscalSponsorship =
    canEdit && !presentationMode && !isCanvasFullscreen && !programsPreviewOnly
  if (!canOpenFiscalSponsorship && !hasCarouselControls) return null

  return (
    <div className="flex items-center gap-1">
      {canOpenFiscalSponsorship ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg p-0 hover:bg-transparent"
          aria-label={fiscalSponsorshipActionLabel}
          aria-pressed={fiscalSponsorshipCardVisible}
          onClick={onOpenFiscalSponsorship}
        >
          <span aria-hidden>
            <FiscalSponsorshipMark className="size-8 rounded-lg text-xs" />
          </span>
        </Button>
      ) : null}
      {hasCarouselControls ? (
        <>
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
        </>
      ) : null}
    </div>
  )
}

function renderProgramsFooterAction({
  canEdit,
  onProgramsCreateOpenChange,
  programsPreviewOnly,
}: {
  canEdit: boolean
  onProgramsCreateOpenChange: (open: boolean) => void
  programsPreviewOnly: boolean
}) {
  if (!canEdit) return null

  return (
    <Button
      type="button"
      size="sm"
      className="ml-auto"
      disabled={programsPreviewOnly}
      onClick={() => onProgramsCreateOpenChange(true)}
    >
      Add
    </Button>
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
  const workspacePrograms = data.organizationEditorData?.programs
  const programs = useMemo(() => workspacePrograms ?? [], [workspacePrograms])
  const legacyProgramsValue =
    data.organizationEditorData?.initialProfile.programs
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null)
  const [canScrollPrevious, setCanScrollPrevious] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const programsPreviewOnly = isWorkspaceProgramsPreviewOnlyStep(
    data.tutorialStepId
  )
  const hasCarouselControls = useMemo(
    () =>
      resolveWorkspaceProgramsDisplayPrograms({
        programs,
        legacyProgramsValue,
      }).length > 1,
    [legacyProgramsValue, programs]
  )

  useEffect(() => {
    if (!hasCarouselControls || !carouselApi) {
      setCanScrollPrevious(false)
      setCanScrollNext(false)
      return
    }

    const updateCarouselState = () => {
      setCanScrollPrevious(carouselApi.canScrollPrev())
      setCanScrollNext(carouselApi.canScrollNext())
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
        canScrollNext,
        canScrollPrevious,
        fiscalSponsorshipCardVisible:
          data.fiscalSponsorshipCardVisible === true,
        hasCarouselControls,
        isCanvasFullscreen,
        onOpenFiscalSponsorship: () => data.onOpenCard?.("fiscal-sponsorship"),
        onScrollNext: () => carouselApi?.scrollNext(),
        onScrollPrevious: () => carouselApi?.scrollPrev(),
        presentationMode,
        programsPreviewOnly,
      })}
      size={effectiveCardSize}
      presentationMode={presentationMode}
      fullHref={cardMeta.fullHref}
      canEdit={canEdit}
      shellInsetClassName="px-3 pt-3 pb-0"
      contentClassName={contentClassName}
      contentSurface="plain"
      editorHref={null}
      footer={renderProgramsFooterAction({
        canEdit,
        onProgramsCreateOpenChange,
        programsPreviewOnly,
      })}
      footerClassName="px-3 pt-2 pb-3"
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
