"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { WorkspaceObjectivePlannerPanel } from "@/features/workspace-objective-planner/client"
import { createPortal } from "react-dom"
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import type { WorkspaceParticlesController } from "../hooks/use-workspace-particles-controller"
import { particleSourceKey } from "../lib"
import { ParticleIcon } from "./particle-preview"

type WorkspaceParticlesContextValue = Pick<
  WorkspaceParticlesController,
  | "state"
  | "sources"
  | "canEdit"
  | "setCanvas"
  | "driveStatus"
  | "refreshDrive"
  | "updateRoadmapSection"
  | "pickDriveFiles"
  | "add"
  | "remove"
  | "resize"
  | "uploadImage"
  | "uploading"
  | "editingPlan"
  | "setEditingPlan"
  | "savePlan"
  | "completePlanStep"
  | "updateDecision"
  | "announcement"
> & {
  addFromSourceClick: WorkspaceParticlesController["add"]
}

const ParticleContext = createContext<WorkspaceParticlesContextValue | null>(
  null
)
export function useWorkspaceParticles() {
  return useContext(ParticleContext)
}

export function WorkspaceParticlesProvider({
  controller,
  children,
  preview = false,
}: {
  controller: WorkspaceParticlesController
  children: ReactNode
  preview?: boolean
}) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    })
  )
  const [draggingSource, setDraggingSource] = useState<string | null>(null)
  const sourceDragActiveRef = useRef(false)
  const sourceDragEndedAtRef = useRef(0)
  const addParticle = controller.add
  const addFromSourceClick = useCallback<WorkspaceParticlesController["add"]>(
    (...args) => {
      if (
        sourceDragActiveRef.current ||
        performance.now() - sourceDragEndedAtRef.current < 250
      )
        return false
      return addParticle(...args)
    },
    [addParticle]
  )
  const contextValue = useMemo<WorkspaceParticlesContextValue>(
    () => ({
      state: controller.state,
      sources: controller.sources,
      canEdit: controller.canEdit,
      setCanvas: controller.setCanvas,
      driveStatus: controller.driveStatus,
      refreshDrive: controller.refreshDrive,
      updateRoadmapSection: controller.updateRoadmapSection,
      pickDriveFiles: controller.pickDriveFiles,
      add: controller.add,
      addFromSourceClick,
      remove: controller.remove,
      resize: controller.resize,
      uploadImage: controller.uploadImage,
      uploading: controller.uploading,
      editingPlan: controller.editingPlan,
      setEditingPlan: controller.setEditingPlan,
      savePlan: controller.savePlan,
      completePlanStep: controller.completePlanStep,
      updateDecision: controller.updateDecision,
      announcement: controller.announcement,
    }),
    [
      addFromSourceClick,
      controller.add,
      controller.announcement,
      controller.canEdit,
      controller.completePlanStep,
      controller.driveStatus,
      controller.editingPlan,
      controller.pickDriveFiles,
      controller.refreshDrive,
      controller.remove,
      controller.resize,
      controller.savePlan,
      controller.setCanvas,
      controller.setEditingPlan,
      controller.sources,
      controller.state,
      controller.updateDecision,
      controller.updateRoadmapSection,
      controller.uploadImage,
      controller.uploading,
    ]
  )
  const source = controller.sources.find(
    (entry) => particleSourceKey(entry.ref) === draggingSource
  )
  return (
    <ParticleContext.Provider value={contextValue}>
      <DndContext
        sensors={sensors}
        autoScroll={false}
        onDragStart={({ active }) => {
          sourceDragActiveRef.current = true
          setDraggingSource(String(active.data.current?.sourceKey ?? ""))
        }}
        onDragCancel={() => {
          sourceDragActiveRef.current = false
          sourceDragEndedAtRef.current = performance.now()
          setDraggingSource(null)
        }}
        onDragEnd={({ active, delta, activatorEvent }) => {
          sourceDragActiveRef.current = false
          sourceDragEndedAtRef.current = performance.now()
          setDraggingSource(null)
          const selected = controller.sources.find(
            (entry) =>
              particleSourceKey(entry.ref) === active.data.current?.sourceKey
          )
          const initial =
            "touches" in activatorEvent
              ? (activatorEvent as TouchEvent).touches[0]
              : (activatorEvent as MouseEvent)
          if (!selected || !initial || !controller.canvas.current) return
          const point = {
            x: initial.clientX + delta.x,
            y: initial.clientY + delta.y,
          }
          const rect = controller.canvas.current.getBoundingClientRect()
          const target = document.elementFromPoint(point.x, point.y)
          if (
            !target?.closest("[data-workspace-canvas-flow-frame]") ||
            target.closest("[data-workspace-data-drawer-body]")
          )
            return
          if (
            point.x < rect.left ||
            point.x > rect.right ||
            point.y < rect.top ||
            point.y > rect.bottom
          )
            return
          controller.add(selected.ref, point)
        }}
      >
        {children}
        {typeof document !== "undefined"
          ? createPortal(
              <DragOverlay
                dropAnimation={null}
                style={{ pointerEvents: "none" }}
              >
                {source ? (
                  <div className="bg-card text-foreground flex w-56 items-center gap-3 rounded-xl border p-4 shadow-lg">
                    <ParticleIcon kind={source.ref.kind} />
                    <span className="truncate text-sm font-medium">
                      {source.title}
                    </span>
                  </div>
                ) : null}
              </DragOverlay>,
              document.body
            )
          : null}
      </DndContext>
      {controller.editingPlan && controller.canEdit ? (
        <WorkspaceObjectivePlannerPanel
          key={controller.editingPlan}
          preview={preview}
          plan={controller.state.plans?.find(
            (plan) => plan.id === controller.editingPlan
          )}
          canEdit={controller.canEdit}
          onSave={controller.savePlan}
          onClose={() => controller.setEditingPlan(null)}
        />
      ) : null}
      <span className="sr-only" role="status" aria-live="polite">
        {controller.announcement}
      </span>
    </ParticleContext.Provider>
  )
}
