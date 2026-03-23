"use client"

import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import Layers from "lucide-react/dist/esm/icons/layers"

import {
  getReactGrabLinkedSurfaceProps,
  getReactGrabOwnerProps,
} from "@/components/dev/react-grab-surface"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { WorkspaceTutorialCallout } from "@/components/workspace/workspace-tutorial-callout"
import {
  WORKSPACE_TUTORIAL_INVERSE_TOOLTIP_CLASSNAME,
  WORKSPACE_TUTORIAL_NEUTRAL_SURFACE_CLASSNAME,
} from "@/components/workspace/workspace-tutorial-theme"
import { getTrackIcon } from "@/lib/accelerator/track-icons"
import { cn } from "@/lib/utils"

import type {
  WorkspaceAcceleratorLessonGroupSummary,
  WorkspaceAcceleratorTutorialCallout,
  WorkspaceAcceleratorTutorialInteractionPolicy,
} from "../types"
import {
  isWorkspaceAcceleratorTutorialPinnedClassGroup,
  shouldWorkspaceAcceleratorTutorialBlockClassSelection,
} from "./workspace-accelerator-card-tutorial-guards"
import { WorkspaceAcceleratorTutorialGuardTooltip } from "./workspace-accelerator-tutorial-guard-tooltip"
import { resolveWorkspaceAcceleratorHeaderPickerScrollDistance } from "./workspace-accelerator-header-picker-overflow"
import { useWorkspaceAcceleratorTutorialGuard } from "./use-workspace-accelerator-tutorial-guard"

const WORKSPACE_ACCELERATOR_HEADER_PICKER_SOURCE =
  "src/features/workspace-accelerator-card/components/workspace-accelerator-header-picker.tsx"
const WORKSPACE_TUTORIAL_THEME_SOURCE =
  "src/components/workspace/workspace-tutorial-theme.ts"

const WORKSPACE_ACCELERATOR_TUTORIAL_PICKER_TRIGGER_CLASSNAME =
  cn(
    "h-9 min-h-9 rounded-xl px-3",
    WORKSPACE_TUTORIAL_NEUTRAL_SURFACE_CLASSNAME,
  )
const WORKSPACE_ACCELERATOR_COMPACT_PICKER_TRIGGER_CLASSNAME =
  "w-[164px] max-w-[44vw]"
const WORKSPACE_ACCELERATOR_EXPANDED_PICKER_TRIGGER_CLASSNAME =
  "w-[216px] max-w-[32vw]"

function WorkspaceAcceleratorHeaderPickerLabel({
  label,
}: {
  label: string
}) {
  const viewportRef = useRef<HTMLSpanElement | null>(null)
  const contentRef = useRef<HTMLSpanElement | null>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [scrollDistance, setScrollDistance] = useState(0)

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const content = contentRef.current
    if (!viewport || !content) return

    const measure = () => {
      const nextScrollDistance =
        resolveWorkspaceAcceleratorHeaderPickerScrollDistance({
          contentWidth: content.scrollWidth,
          viewportWidth: viewport.clientWidth,
        })
      setScrollDistance(nextScrollDistance)
    }

    measure()

    if (typeof ResizeObserver === "undefined") return

    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    observer.observe(content)

    return () => observer.disconnect()
  }, [label])

  return (
    <span
      ref={viewportRef}
      className="min-w-0 flex-1 overflow-hidden"
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
    >
      <span
        ref={contentRef}
        className="inline-block min-w-full whitespace-nowrap text-left transition-transform duration-1000 ease-out will-change-transform"
        style={
          scrollDistance > 0 && isHovered
            ? { transform: `translateX(-${scrollDistance}px)` }
            : undefined
        }
      >
        {label}
      </span>
    </span>
  )
}

export function WorkspaceAcceleratorHeaderPicker({
  lessonGroupOptions,
  selectedLessonGroupKey,
  tutorialCallout,
  tutorialInteractionPolicy = null,
  viewerOpen = false,
  onLessonGroupChange,
}: {
  lessonGroupOptions: WorkspaceAcceleratorLessonGroupSummary[]
  selectedLessonGroupKey: string
  tutorialCallout: WorkspaceAcceleratorTutorialCallout | null
  tutorialInteractionPolicy?: WorkspaceAcceleratorTutorialInteractionPolicy | null
  viewerOpen?: boolean
  onLessonGroupChange: (nextLessonGroupKey: string) => void
}) {
  const selectedLessonGroup =
    lessonGroupOptions.find((option) => option.key === selectedLessonGroupKey) ?? null
  const ActiveLessonGroupIcon = useMemo(() => {
    if (!selectedLessonGroup) return Layers
    return getTrackIcon(selectedLessonGroup.label)
  }, [selectedLessonGroup])
  const selectedLessonGroupLabel = selectedLessonGroup?.label ?? "Classes"
  const pickerHighlighted = tutorialCallout?.focus === "picker"
  const tutorialManagedPicker = Boolean(tutorialInteractionPolicy)
  const classSelectionGuard = useWorkspaceAcceleratorTutorialGuard({
    enabled: Boolean(tutorialInteractionPolicy),
    defaultMessage:
      tutorialInteractionPolicy?.blockedMessage ??
      "We'll go over this soon, I promise! :)",
    durationMs: tutorialInteractionPolicy?.blockedMessageDurationMs ?? 3000,
  })
  const reactGrabOwnerId =
    "workspace-accelerator-header-picker:class-selection"
  const reactGrabOwnerProps = getReactGrabOwnerProps({
    ownerId: reactGrabOwnerId,
    component: "WorkspaceAcceleratorHeaderPicker",
    source: WORKSPACE_ACCELERATOR_HEADER_PICKER_SOURCE,
    slot: "trigger",
    variant: tutorialInteractionPolicy?.stepId ?? "default",
    tokenSource: WORKSPACE_TUTORIAL_THEME_SOURCE,
    primitiveImport: "@/components/ui/select",
  })
  const reactGrabWrapperProps = getReactGrabLinkedSurfaceProps({
    ownerId: reactGrabOwnerId,
    component: "WorkspaceAcceleratorHeaderPicker",
    source: WORKSPACE_ACCELERATOR_HEADER_PICKER_SOURCE,
    slot: "wrapper",
    surfaceKind: "root",
    tokenSource: WORKSPACE_TUTORIAL_THEME_SOURCE,
    primitiveImport: "@/components/ui/select",
  })

  const trigger = (
    <WorkspaceAcceleratorTutorialGuardTooltip
      open={classSelectionGuard.open}
      message={classSelectionGuard.message}
      ownerDescriptor={{
        ownerId: reactGrabOwnerId,
        component: "WorkspaceAcceleratorHeaderPicker",
        source: WORKSPACE_ACCELERATOR_HEADER_PICKER_SOURCE,
        slot: "tooltip-content",
        variant: tutorialInteractionPolicy?.stepId ?? "default",
      }}
      side="top"
      align="end"
      sideOffset={10}
    >
      <SelectTrigger
        {...reactGrabOwnerProps}
        className={cn(
          "relative h-8 min-h-8 gap-1.5 overflow-visible border-border/65 bg-background/80 px-2 text-left text-xs",
          viewerOpen
            ? WORKSPACE_ACCELERATOR_EXPANDED_PICKER_TRIGGER_CLASSNAME
            : WORKSPACE_ACCELERATOR_COMPACT_PICKER_TRIGGER_CLASSNAME,
          tutorialManagedPicker &&
            WORKSPACE_ACCELERATOR_TUTORIAL_PICKER_TRIGGER_CLASSNAME,
        )}
        aria-label={`Choose a class track. Current selection: ${selectedLessonGroupLabel}`}
      >
        {pickerHighlighted ? (
          <WorkspaceTutorialCallout
            reactGrabOwnerId={`${reactGrabOwnerId}:callout`}
            mode="indicator"
            tooltipContentClassName={WORKSPACE_TUTORIAL_INVERSE_TOOLTIP_CLASSNAME}
            indicatorAnchorAlign="end"
            indicatorAnchorVerticalAlign="center"
            indicatorSide="right"
            indicatorSideOffset={12}
          />
        ) : null}
        <span className="inline-flex size-4 shrink-0 items-center justify-center">
          <ActiveLessonGroupIcon
            className={cn(
              "h-3.5 w-3.5",
              "text-muted-foreground",
              pickerHighlighted && "text-foreground/70",
            )}
            aria-hidden
          />
        </span>
        <WorkspaceAcceleratorHeaderPickerLabel label={selectedLessonGroupLabel} />
      </SelectTrigger>
    </WorkspaceAcceleratorTutorialGuardTooltip>
  )

  return (
    <div
      {...reactGrabWrapperProps}
      className="inline-flex items-start pb-1"
    >
      <Select
        value={selectedLessonGroupKey}
        onValueChange={(nextLessonGroupKey) => {
          if (
            shouldWorkspaceAcceleratorTutorialBlockClassSelection({
              tutorialInteractionPolicy,
              lessonGroupKey: nextLessonGroupKey,
            })
          ) {
            classSelectionGuard.showBlockedFeedback("class-selection")
            return
          }

          onLessonGroupChange(nextLessonGroupKey)
        }}
      >
        {trigger}
        <SelectContent
          align="end"
          {...getReactGrabLinkedSurfaceProps({
            ownerId: reactGrabOwnerId,
            component: "WorkspaceAcceleratorHeaderPicker",
            source: WORKSPACE_ACCELERATOR_HEADER_PICKER_SOURCE,
            slot: "content",
            surfaceKind: "content",
            tokenSource: WORKSPACE_TUTORIAL_THEME_SOURCE,
            primitiveImport: "@/components/ui/select",
          })}
        >
          {lessonGroupOptions.map((option) => (
            <SelectItem
              key={option.key}
              value={option.key}
              className={cn(
                tutorialInteractionPolicy &&
                  !isWorkspaceAcceleratorTutorialPinnedClassGroup({
                    tutorialInteractionPolicy,
                    lessonGroupKey: option.key,
                  }) &&
                  "opacity-80",
              )}
              icon={
                (() => {
                  const OptionIcon = getTrackIcon(option.label)
                  return <OptionIcon className="h-4 w-4" aria-hidden />
                })()
              }
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
