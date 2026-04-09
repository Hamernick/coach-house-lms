"use client"

import type { WorkspaceAcceleratorCardRuntimeSnapshot } from "@/features/workspace-accelerator-card"
import { TabsList, TabsTrigger } from "@/components/ui/tabs"

import type { WorkspaceBoardExecutionTab } from "./workspace-board-node-tool-card-execution"
import { WorkspaceBoardLazyAcceleratorHeaderPicker } from "./workspace-board-accelerator-lazy"

export function WorkspaceBoardExecutionCardHeaderControls({
  activeTab,
  runtimeSnapshot,
  onLessonGroupChange,
}: {
  activeTab: WorkspaceBoardExecutionTab
  runtimeSnapshot: WorkspaceAcceleratorCardRuntimeSnapshot | null
  onLessonGroupChange?: ((lessonGroupKey: string) => void) | null
}) {
  return (
    <div className="flex items-center gap-2">
      <TabsList className="inline-flex w-fit items-center rounded-full border border-border/70 bg-background/70 p-1">
        <TabsTrigger
          value="roadmap"
          className="rounded-full border border-transparent px-3 py-1.5 text-[11px] data-[state=active]:border-border/70 data-[state=active]:bg-muted/55 data-[state=active]:text-foreground data-[state=active]:shadow-sm"
        >
          Strategic Roadmap
        </TabsTrigger>
        <TabsTrigger
          value="accelerator"
          className="rounded-full border border-transparent px-3 py-1.5 text-[11px] data-[state=active]:border-border/70 data-[state=active]:bg-muted/55 data-[state=active]:text-foreground data-[state=active]:shadow-sm"
        >
          Accelerator
        </TabsTrigger>
      </TabsList>
      {activeTab === "accelerator" &&
      runtimeSnapshot?.lessonGroupOptions?.length &&
      onLessonGroupChange ? (
        <WorkspaceBoardLazyAcceleratorHeaderPicker
          lessonGroupOptions={runtimeSnapshot.lessonGroupOptions}
          selectedLessonGroupKey={
            runtimeSnapshot.selectedLessonGroupKey ||
            runtimeSnapshot.lessonGroupOptions[0]?.key ||
            ""
          }
          tutorialCallout={null}
          tutorialInteractionPolicy={null}
          onLessonGroupChange={onLessonGroupChange}
        />
      ) : null}
    </div>
  )
}
