"use client"

import { useCallback } from "react"

import { WORKSPACE_MAP_FEATURE_ENABLED } from "@/lib/workspace-map-feature"

import { WorkspaceBoardOrganizationMapButton } from "./workspace-board-organization-map-button"
import { WorkspaceBoardOrganizationCardShell } from "./workspace-board-organization-card-shell"
import { OrganizationOverviewCard } from "./workspace-board-node-static-cards"
import { WORKSPACE_CARD_META } from "./workspace-board-copy"
import type { WorkspaceBoardNodeData } from "./workspace-board-node-types"
import type { WorkspaceCardSize } from "./workspace-board-types"

export function resolveOrganizationHeaderAction({
  orgId,
  profile,
  highlighted,
  instruction,
  onPress,
}: {
  orgId: string
  profile: Parameters<typeof WorkspaceBoardOrganizationMapButton>[0]["profile"]
  highlighted: boolean
  instruction: string | null
  onPress: () => void
}) {
  if (!WORKSPACE_MAP_FEATURE_ENABLED) {
    return undefined
  }

  return (
    <WorkspaceBoardOrganizationMapButton
      orgId={orgId}
      profile={profile}
      highlighted={highlighted}
      instruction={instruction}
      onPress={onPress}
    />
  )
}

export function renderOrganizationOverviewCard({
  size,
  presentationMode,
  canEdit,
  contentClassName,
  organizationEditorHref,
  headerAction,
  isCanvasFullscreen,
  onToggleCanvasFullscreen,
  seed,
  organizationEditorData,
}: {
  size: WorkspaceCardSize
  presentationMode: boolean
  canEdit: boolean
  contentClassName: string | undefined
  organizationEditorHref: string
  headerAction: ReturnType<typeof resolveOrganizationHeaderAction>
  isCanvasFullscreen: boolean
  onToggleCanvasFullscreen?: () => void
  seed: WorkspaceBoardNodeData["seed"]
  organizationEditorData: WorkspaceBoardNodeData["organizationEditorData"]
}) {
  const cardMeta = WORKSPACE_CARD_META["organization-overview"]

  return (
    <WorkspaceBoardOrganizationCardShell
      title={cardMeta.title}
      subtitle={cardMeta.subtitle}
      headerMeta={undefined}
      size={size}
      presentationMode={presentationMode}
      fullHref={cardMeta.fullHref}
      canEdit={canEdit}
      contentClassName={contentClassName}
      editorHref={canEdit ? organizationEditorHref : null}
      headerAction={headerAction}
      isCanvasFullscreen={isCanvasFullscreen}
      onToggleCanvasFullscreen={onToggleCanvasFullscreen}
    >
      <OrganizationOverviewCard
        size={size}
        seed={seed}
        presentationMode={presentationMode}
        organizationEditorData={organizationEditorData}
      />
    </WorkspaceBoardOrganizationCardShell>
  )
}

export function useOrganizationMapCardAction(data: WorkspaceBoardNodeData) {
  const organizationMapButtonCallout = data.organizationMapButtonCallout ?? null

  const handleOpenMapCard = useCallback(() => {
    data.onOpenCard?.("atlas")
    if (organizationMapButtonCallout) {
      data.onOrganizationMapButtonTutorialComplete?.("complete-and-advance")
    }
  }, [data, organizationMapButtonCallout])

  return {
    organizationMapButtonCallout,
    handleOpenMapCard,
  }
}
