import { useEffect, useId, useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { ROADMAP_SECTION_ICONS } from "@/components/roadmap/roadmap-icons"
import { RoadmapSectionPanel } from "@/components/roadmap/roadmap-section-panel"
import { saveRoadmapSectionAction } from "@/actions/roadmap"
import { toast } from "@/lib/toast"
import type {
  RoadmapSectionDefinition,
  RoadmapSectionStatus,
} from "@/lib/roadmap"

import type { ModuleAssignmentField } from "../../types"

type RoadmapCheckpointFieldProps = {
  field: ModuleAssignmentField
  definition: RoadmapSectionDefinition
  value: string
  pending: boolean
  autoSaving: boolean
  roadmapStatusBySectionId?: Record<string, RoadmapSectionStatus>
  onChange: (next: string) => void
}

export function RoadmapCheckpointField({
  field,
  definition,
  value,
  pending,
  autoSaving,
  roadmapStatusBySectionId,
  onChange,
}: RoadmapCheckpointFieldProps) {
  const SectionIcon =
    ROADMAP_SECTION_ICONS[definition.id] ?? ROADMAP_SECTION_ICONS.origin_story
  const inferredStatus: RoadmapSectionStatus =
    value.trim().length > 0 ? "in_progress" : "not_started"
  const [status, setStatus] = useState<RoadmapSectionStatus>(
    roadmapStatusBySectionId?.[definition.id] ?? inferredStatus,
  )
  const [statusPending, startStatusTransition] = useTransition()
  const toolbarId = useId()

  useEffect(() => {
    setStatus(roadmapStatusBySectionId?.[definition.id] ?? inferredStatus)
  }, [definition.id, inferredStatus, roadmapStatusBySectionId])

  const handleStatusChange = (nextValue: string) => {
    const nextStatus = nextValue as RoadmapSectionStatus
    if (nextStatus === status) return
    setStatus(nextStatus)
    startStatusTransition(async () => {
      const result = await saveRoadmapSectionAction({
        sectionId: definition.id,
        status: nextStatus,
      })
      if ("error" in result) {
        toast.error(result.error)
        setStatus(roadmapStatusBySectionId?.[definition.id] ?? inferredStatus)
      }
    })
  }

  const saveLabel = statusPending || pending || autoSaving ? "Saving…" : "Saved"

  return (
    <RoadmapSectionPanel
      title={definition.title}
      subtitle={definition.subtitle}
      icon={SectionIcon}
      status={status}
      headerVariant="calendar"
      contentMaxWidth="max-w-none"
      panelClassName="gap-4 p-4"
      canEdit
      onStatusChange={handleStatusChange}
      statusSelectDisabled={statusPending}
      toolbarSlotId={toolbarId}
      editorProps={{
        value,
        onChange,
        placeholder: definition.placeholder ?? field.placeholder,
        header: definition.prompt ?? field.label,
        headerClassName: "bg-[#f4f4f5] px-4 pt-4 pb-3 text-sm text-muted-foreground dark:bg-[#1f1f1f]",
        countClassName: "bg-[#e6e6e6] px-4 py-2 text-xs text-muted-foreground dark:bg-[#1c1c1c]",
        contentClassName:
          "flex-1 min-h-0 overflow-y-auto overscroll-contain bg-[#ededed] dark:bg-[#171717] rounded-none",
        toolbarClassName:
          "rounded-xl border border-border/60 bg-background/80 shadow-[0_1px_1px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_1px_rgba(0,0,0,0.24)]",
        className: "flex h-full min-h-0 flex-1 flex-col bg-card dark:bg-[#1f1f1f]",
        editorClassName:
          "flex-1 min-h-0 h-full overflow-visible rounded-none bg-transparent dark:bg-[#171717]",
        minHeight: 560,
        disableResize: true,
        toolbarPortalId: toolbarId,
        toolbarTrailingActions: (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="gap-2 text-muted-foreground"
            disabled
          >
            {saveLabel}
          </Button>
        ),
      }}
    />
  )
}
