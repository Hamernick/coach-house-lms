import { describe, expect, it, vi } from "vitest"

import {
  buildAcceleratorStepNodeData,
  ACCELERATOR_STEP_NODE_DIMENSIONS,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-flow-surface-accelerator-graph-composition"

describe("workspace accelerator step node layout", () => {
  it("uses the compact assignment size for lightweight prompts", () => {
    const node = buildAcceleratorStepNodeData({
      acceleratorRuntimeSnapshot: {
        currentStep: {
          id: "module-1:assignment",
          moduleId: "module-1",
          moduleTitle: "CRM setup",
          stepKind: "assignment",
          stepTitle: "Assignment",
          stepDescription: "Answer the prompt",
          href: "/accelerator/class/formation/module/1",
          status: "in_progress",
          stepSequenceIndex: 1,
          stepSequenceTotal: 1,
          moduleSequenceIndex: 1,
          moduleSequenceTotal: 1,
          groupTitle: "Formation",
          videoUrl: null,
          durationMinutes: null,
          resources: [],
          hasAssignment: true,
          hasDeck: false,
          moduleContext: {
            classTitle: "Accelerator",
            lessonNotesContent: null,
            moduleResources: [],
            assignmentFields: [
              {
                name: "crm_status",
                label: "Do you currently use a CRM?",
                type: "select",
                required: true,
                options: ["Yes", "No"],
              },
            ],
            assignmentSubmission: null,
            completeOnSubmit: false,
          },
        },
        currentIndex: 0,
        totalSteps: 1,
        canGoPrevious: false,
        canGoNext: false,
        currentModuleStepIndex: 0,
        currentModuleStepTotal: 1,
        currentModuleCompletedCount: 0,
        isCurrentModuleCompleted: false,
        isCurrentStepCompleted: false,
      },
      acceleratorStepNodePositionOverride: null,
      acceleratorStepNodeVisible: true,
      autoLayoutMode: "dagre-tree",
      allowEditing: true,
      acceleratorWorkspaceNode: {
        id: "accelerator",
        x: 100,
        y: 120,
        size: "sm",
      },
      isCanvasFullscreen: false,
      presentationMode: false,
      onPrevious: vi.fn(),
      onNext: vi.fn(),
      onComplete: vi.fn(),
      onClose: vi.fn(),
    })

    expect(node?.style?.width).toBe(
      ACCELERATOR_STEP_NODE_DIMENSIONS.assignmentCompact.width,
    )
    expect(node?.style?.minHeight).toBe(
      ACCELERATOR_STEP_NODE_DIMENSIONS.assignmentCompact.height,
    )
    expect(node?.style?.height).toBeUndefined()
  })

  it("keeps two-field lightweight assignment prompts on the compact size tier", () => {
    const node = buildAcceleratorStepNodeData({
      acceleratorRuntimeSnapshot: {
        currentStep: {
          id: "module-1:assignment",
          moduleId: "module-1",
          moduleTitle: "CRM setup",
          stepKind: "assignment",
          stepTitle: "Assignment",
          stepDescription: "Answer the prompt",
          href: "/accelerator/class/formation/module/1",
          status: "in_progress",
          stepSequenceIndex: 1,
          stepSequenceTotal: 1,
          moduleSequenceIndex: 1,
          moduleSequenceTotal: 1,
          groupTitle: "Formation",
          videoUrl: null,
          durationMinutes: null,
          resources: [],
          hasAssignment: true,
          hasDeck: false,
          moduleContext: {
            classTitle: "Accelerator",
            lessonNotesContent: null,
            moduleResources: [],
            assignmentFields: [
              {
                name: "crm_status",
                label: "Do you currently use a CRM?",
                type: "select",
                required: true,
                options: ["Yes", "No"],
              },
              {
                name: "crm_notes",
                label: "What are you using today?",
                type: "short_text",
                required: false,
              },
            ],
            assignmentSubmission: null,
            completeOnSubmit: false,
          },
        },
        currentIndex: 0,
        totalSteps: 1,
        canGoPrevious: false,
        canGoNext: false,
        currentModuleStepIndex: 0,
        currentModuleStepTotal: 1,
        currentModuleCompletedCount: 0,
        isCurrentModuleCompleted: false,
        isCurrentStepCompleted: false,
      },
      acceleratorStepNodePositionOverride: null,
      acceleratorStepNodeVisible: true,
      autoLayoutMode: "dagre-tree",
      allowEditing: true,
      acceleratorWorkspaceNode: {
        id: "accelerator",
        x: 100,
        y: 120,
        size: "sm",
      },
      isCanvasFullscreen: false,
      presentationMode: false,
      onPrevious: vi.fn(),
      onNext: vi.fn(),
      onComplete: vi.fn(),
      onClose: vi.fn(),
    })

    expect(node?.style?.width).toBe(
      ACCELERATOR_STEP_NODE_DIMENSIONS.assignmentCompact.width,
    )
    expect(node?.style?.minHeight).toBe(
      ACCELERATOR_STEP_NODE_DIMENSIONS.assignmentCompact.height,
    )
    expect(node?.style?.height).toBeUndefined()
  })

  it("builds resource step nodes with intrinsic height and a compact baseline", () => {
    const node = buildAcceleratorStepNodeData({
      acceleratorRuntimeSnapshot: {
        currentStep: {
          id: "module-1:resources",
          moduleId: "module-1",
          moduleTitle: "Naming your NFP",
          stepKind: "resources",
          stepTitle: "Resources",
          stepDescription: "Review the worksheet",
          href: "/accelerator/class/formation/module/1",
          status: "not_started",
          stepSequenceIndex: 1,
          stepSequenceTotal: 1,
          moduleSequenceIndex: 1,
          moduleSequenceTotal: 1,
          groupTitle: "Formation",
          videoUrl: null,
          durationMinutes: null,
          resources: [],
          hasAssignment: false,
          hasDeck: false,
          moduleContext: null,
        },
        currentIndex: 0,
        totalSteps: 1,
        canGoPrevious: false,
        canGoNext: false,
        currentModuleStepIndex: 0,
        currentModuleStepTotal: 1,
        currentModuleCompletedCount: 0,
        isCurrentModuleCompleted: false,
        isCurrentStepCompleted: false,
      },
      acceleratorStepNodePositionOverride: null,
      acceleratorStepNodeVisible: true,
      autoLayoutMode: "dagre-tree",
      allowEditing: true,
      acceleratorWorkspaceNode: {
        id: "accelerator",
        x: 100,
        y: 120,
        size: "sm",
      },
      isCanvasFullscreen: false,
      presentationMode: false,
      onPrevious: vi.fn(),
      onNext: vi.fn(),
      onComplete: vi.fn(),
      onClose: vi.fn(),
    })

    expect(node?.className).toContain("h-auto")
    expect(node?.style?.width).toBe(ACCELERATOR_STEP_NODE_DIMENSIONS.resources.width)
    expect(node?.style?.minHeight).toBe(ACCELERATOR_STEP_NODE_DIMENSIONS.resources.height)
    expect(node?.style?.height).toBeUndefined()
  })

  it("keeps budget-table assignments intrinsic while preserving the larger baseline width", () => {
    const node = buildAcceleratorStepNodeData({
      acceleratorRuntimeSnapshot: {
        currentStep: {
          id: "module-1:assignment",
          moduleId: "module-1",
          moduleTitle: "Budgeting for a Program",
          stepKind: "assignment",
          stepTitle: "Assignment",
          stepDescription: "Complete the worksheet",
          href: "/accelerator/class/foundation/module/1",
          status: "in_progress",
          stepSequenceIndex: 1,
          stepSequenceTotal: 1,
          moduleSequenceIndex: 1,
          moduleSequenceTotal: 1,
          groupTitle: "Strategic Foundations",
          videoUrl: null,
          durationMinutes: null,
          resources: [],
          hasAssignment: true,
          hasDeck: false,
          moduleContext: {
            classTitle: "Accelerator",
            lessonNotesContent: null,
            moduleResources: [],
            assignmentFields: [
              {
                name: "budget",
                label: "Budget",
                type: "budget_table",
                required: true,
              },
            ],
            assignmentSubmission: null,
            completeOnSubmit: false,
          },
        },
        currentIndex: 0,
        totalSteps: 1,
        canGoPrevious: false,
        canGoNext: true,
        currentModuleStepIndex: 0,
        currentModuleStepTotal: 1,
        currentModuleCompletedCount: 0,
        isCurrentModuleCompleted: false,
        isCurrentStepCompleted: false,
      },
      acceleratorStepNodePositionOverride: null,
      acceleratorStepNodeVisible: true,
      autoLayoutMode: "dagre-tree",
      allowEditing: true,
      acceleratorWorkspaceNode: {
        id: "accelerator",
        x: 100,
        y: 120,
        size: "sm",
      },
      isCanvasFullscreen: false,
      presentationMode: false,
      onPrevious: vi.fn(),
      onNext: vi.fn(),
      onComplete: vi.fn(),
      onClose: vi.fn(),
    })

    expect(node?.style?.width).toBe(ACCELERATOR_STEP_NODE_DIMENSIONS.assignmentWithBudget.width)
    expect(node?.style?.minHeight).toBe(
      ACCELERATOR_STEP_NODE_DIMENSIONS.assignmentWithBudget.height,
    )
    expect(node?.style?.height).toBeUndefined()
  })

  it("keeps text-heavy assignments on the expanded assignment width", () => {
    const node = buildAcceleratorStepNodeData({
      acceleratorRuntimeSnapshot: {
        currentStep: {
          id: "module-1:assignment",
          moduleId: "module-1",
          moduleTitle: "Story capture",
          stepKind: "assignment",
          stepTitle: "Assignment",
          stepDescription: "Write your response",
          href: "/accelerator/class/foundation/module/1",
          status: "in_progress",
          stepSequenceIndex: 1,
          stepSequenceTotal: 1,
          moduleSequenceIndex: 1,
          moduleSequenceTotal: 1,
          groupTitle: "Strategic Foundations",
          videoUrl: null,
          durationMinutes: null,
          resources: [],
          hasAssignment: true,
          hasDeck: false,
          moduleContext: {
            classTitle: "Accelerator",
            lessonNotesContent: null,
            moduleResources: [],
            assignmentFields: [
              {
                name: "origin_story",
                label: "Tell the story",
                type: "long_text",
                required: true,
              },
            ],
            assignmentSubmission: null,
            completeOnSubmit: false,
          },
        },
        currentIndex: 0,
        totalSteps: 1,
        canGoPrevious: false,
        canGoNext: true,
        currentModuleStepIndex: 0,
        currentModuleStepTotal: 1,
        currentModuleCompletedCount: 0,
        isCurrentModuleCompleted: false,
        isCurrentStepCompleted: false,
      },
      acceleratorStepNodePositionOverride: null,
      acceleratorStepNodeVisible: true,
      autoLayoutMode: "dagre-tree",
      allowEditing: true,
      acceleratorWorkspaceNode: {
        id: "accelerator",
        x: 100,
        y: 120,
        size: "sm",
      },
      isCanvasFullscreen: false,
      presentationMode: false,
      onPrevious: vi.fn(),
      onNext: vi.fn(),
      onComplete: vi.fn(),
      onClose: vi.fn(),
    })

    expect(node?.style?.width).toBe(ACCELERATOR_STEP_NODE_DIMENSIONS.assignmentExpanded.width)
    expect(node?.style?.minHeight).toBe(
      ACCELERATOR_STEP_NODE_DIMENSIONS.assignmentExpanded.height,
    )
    expect(node?.style?.height).toBeUndefined()
  })
})
