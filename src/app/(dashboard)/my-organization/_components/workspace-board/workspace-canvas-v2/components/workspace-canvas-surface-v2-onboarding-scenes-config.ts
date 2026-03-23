import type {
  WorkspaceCanvasTutorialSceneId,
} from "@/features/workspace-canvas-tutorial"

import type { WorkspaceCardId } from "../../workspace-board-types"
import type { WorkspaceCanvasTutorialSceneBreakpoint } from "./workspace-canvas-surface-v2-onboarding-scenes"
import { resolveWorkspaceCanvasTutorialBoostedZoom } from "./workspace-canvas-surface-v2-tutorial-zoom"

export type SceneSlotLayout = {
  primary: { x: number; y: number }
  organization: { x: number; y: number }
  parked: Array<{ x: number; y: number }>
  viewport: {
    zoom: number
    offsetX: number
    offsetY: number
  }
  guide: {
    width: number
    minHeight: number
    anchorOffsetX: number
    overlap: number
  }
}

export const SECONDARY_SCENE_CARD_ORDER: WorkspaceCardId[] = [
  "programs",
  "roadmap",
  "accelerator",
  "economic-engine",
  "calendar",
  "communications",
]

export const PRIMARY_CARD_BY_SCENE: Record<
  WorkspaceCanvasTutorialSceneId,
  WorkspaceCardId
> = {
  overview: "organization-overview",
  map: "atlas",
  accelerator: "accelerator",
  "accelerator-module": "accelerator",
  calendar: "calendar",
  programs: "programs",
  roadmap: "roadmap",
  fundraising: "economic-engine",
  communications: "communications",
}

export const SCENE_BY_SHORTCUT_TARGET_CARD: Partial<
  Record<WorkspaceCardId, WorkspaceCanvasTutorialSceneId>
> = {
  atlas: "map",
  accelerator: "accelerator",
  calendar: "calendar",
  programs: "programs",
  roadmap: "roadmap",
  "economic-engine": "fundraising",
  communications: "communications",
}

function boostSceneViewportLayout(layout: SceneSlotLayout): SceneSlotLayout {
  return {
    ...layout,
    viewport: {
      ...layout.viewport,
      zoom: resolveWorkspaceCanvasTutorialBoostedZoom(layout.viewport.zoom),
    },
  }
}

function createBoostedSceneSlotLayouts<
  T extends Record<
    WorkspaceCanvasTutorialSceneId,
    Record<WorkspaceCanvasTutorialSceneBreakpoint, SceneSlotLayout>
  >,
>(layouts: T): T {
  return Object.fromEntries(
    Object.entries(layouts).map(([sceneId, breakpointLayouts]) => [
      sceneId,
      Object.fromEntries(
        Object.entries(breakpointLayouts).map(([breakpoint, layout]) => [
          breakpoint,
          boostSceneViewportLayout(layout),
        ]),
      ),
    ]),
  ) as T
}

const BASE_SCENE_SLOT_LAYOUTS: Record<
  WorkspaceCanvasTutorialSceneId,
  Record<WorkspaceCanvasTutorialSceneBreakpoint, SceneSlotLayout>
> = {
  overview: {
    desktop: {
      primary: { x: 152, y: 248 },
      organization: { x: 152, y: 248 },
      parked: [
        { x: 912, y: 184 },
        { x: 1368, y: 184 },
        { x: 1856, y: 184 },
        { x: 912, y: 676 },
        { x: 1368, y: 676 },
        { x: 1856, y: 676 },
      ],
      viewport: { zoom: 0.74, offsetX: 84, offsetY: -118 },
      guide: { width: 352, minHeight: 156, anchorOffsetX: 40, overlap: 18 },
    },
    tablet: {
      primary: { x: 120, y: 264 },
      organization: { x: 120, y: 264 },
      parked: [
        { x: 720, y: 188 },
        { x: 1100, y: 208 },
        { x: 1480, y: 244 },
        { x: 720, y: 700 },
        { x: 1100, y: 720 },
        { x: 1480, y: 744 },
      ],
      viewport: { zoom: 0.64, offsetX: 58, offsetY: -108 },
      guide: { width: 332, minHeight: 148, anchorOffsetX: 32, overlap: 16 },
    },
    mobile: {
      primary: { x: 56, y: 296 },
      organization: { x: 56, y: 296 },
      parked: [
        { x: 408, y: 136 },
        { x: 408, y: 600 },
        { x: 760, y: 176 },
        { x: 760, y: 640 },
        { x: 1112, y: 224 },
        { x: 1112, y: 688 },
      ],
      viewport: { zoom: 0.56, offsetX: 28, offsetY: -92 },
      guide: { width: 300, minHeight: 140, anchorOffsetX: 22, overlap: 14 },
    },
  },
  map: {
    desktop: {
      primary: { x: 860, y: 164 },
      organization: { x: 128, y: 300 },
      parked: [
        { x: 624, y: 728 },
        { x: 1048, y: 728 },
        { x: 1512, y: 728 },
      ],
      viewport: { zoom: 0.58, offsetX: 56, offsetY: -88 },
      guide: { width: 360, minHeight: 156, anchorOffsetX: 24, overlap: 14 },
    },
    tablet: {
      primary: { x: 652, y: 216 },
      organization: { x: 96, y: 332 },
      parked: [
        { x: 596, y: 732 },
        { x: 976, y: 732 },
      ],
      viewport: { zoom: 0.52, offsetX: 30, offsetY: -74 },
      guide: { width: 328, minHeight: 148, anchorOffsetX: 22, overlap: 14 },
    },
    mobile: {
      primary: { x: 72, y: 332 },
      organization: { x: 40, y: 72 },
      parked: [{ x: 456, y: 696 }],
      viewport: { zoom: 0.46, offsetX: 16, offsetY: -56 },
      guide: { width: 292, minHeight: 138, anchorOffsetX: 18, overlap: 12 },
    },
  },
  accelerator: {
    desktop: {
      primary: { x: 932, y: 208 },
      organization: { x: 136, y: 50 },
      parked: [
        { x: 1680, y: 224 },
        { x: 1680, y: 640 },
        { x: 2160, y: 224 },
        { x: 2160, y: 640 },
      ],
      viewport: { zoom: 0.62, offsetX: 92, offsetY: -72 },
      guide: { width: 336, minHeight: 148, anchorOffsetX: 30, overlap: 16 },
    },
    tablet: {
      primary: { x: 676, y: 248 },
      organization: { x: 96, y: 320 },
      parked: [
        { x: 1120, y: 220 },
        { x: 1120, y: 672 },
        { x: 1504, y: 252 },
        { x: 1504, y: 704 },
      ],
      viewport: { zoom: 0.56, offsetX: 72, offsetY: -64 },
      guide: { width: 320, minHeight: 144, anchorOffsetX: 24, overlap: 14 },
    },
    mobile: {
      primary: { x: 88, y: 324 },
      organization: { x: 48, y: 64 },
      parked: [
        { x: 472, y: 160 },
        { x: 472, y: 624 },
        { x: 824, y: 204 },
        { x: 824, y: 668 },
      ],
      viewport: { zoom: 0.52, offsetX: 20, offsetY: -74 },
      guide: { width: 288, minHeight: 136, anchorOffsetX: 20, overlap: 14 },
    },
  },
  "accelerator-module": {
    desktop: {
      primary: { x: 728, y: 232 },
      organization: { x: 136, y: 50 },
      parked: [
        { x: 1888, y: 224 },
        { x: 1888, y: 664 },
        { x: 2368, y: 252 },
      ],
      viewport: { zoom: 0.48, offsetX: 248, offsetY: -42 },
      guide: { width: 328, minHeight: 144, anchorOffsetX: 24, overlap: 14 },
    },
    tablet: {
      primary: { x: 560, y: 276 },
      organization: { x: 88, y: 340 },
      parked: [
        { x: 1448, y: 248 },
        { x: 1448, y: 708 },
      ],
      viewport: { zoom: 0.44, offsetX: 206, offsetY: -34 },
      guide: { width: 312, minHeight: 140, anchorOffsetX: 22, overlap: 14 },
    },
    mobile: {
      primary: { x: 72, y: 372 },
      organization: { x: 40, y: 72 },
      parked: [
        { x: 944, y: 200 },
        { x: 944, y: 680 },
      ],
      viewport: { zoom: 0.38, offsetX: 182, offsetY: -28 },
      guide: { width: 280, minHeight: 132, anchorOffsetX: 18, overlap: 12 },
    },
  },
  calendar: {
    desktop: {
      primary: { x: 968, y: 208 },
      organization: { x: 132, y: 292 },
      parked: [
        { x: 624, y: 720 },
        { x: 1056, y: 720 },
        { x: 1520, y: 720 },
      ],
      viewport: { zoom: 0.58, offsetX: 36, offsetY: -68 },
      guide: { width: 320, minHeight: 144, anchorOffsetX: 24, overlap: 14 },
    },
    tablet: {
      primary: { x: 724, y: 236 },
      organization: { x: 96, y: 332 },
      parked: [
        { x: 600, y: 716 },
        { x: 980, y: 716 },
        { x: 1360, y: 716 },
      ],
      viewport: { zoom: 0.5, offsetX: 24, offsetY: -58 },
      guide: { width: 304, minHeight: 140, anchorOffsetX: 22, overlap: 14 },
    },
    mobile: {
      primary: { x: 84, y: 344 },
      organization: { x: 40, y: 72 },
      parked: [
        { x: 456, y: 664 },
        { x: 824, y: 688 },
      ],
      viewport: { zoom: 0.48, offsetX: 18, offsetY: -52 },
      guide: { width: 280, minHeight: 132, anchorOffsetX: 18, overlap: 12 },
    },
  },
  programs: {
    desktop: {
      primary: { x: 912, y: 176 },
      organization: { x: 120, y: 292 },
      parked: [
        { x: 632, y: 736 },
        { x: 1096, y: 736 },
        { x: 1560, y: 736 },
      ],
      viewport: { zoom: 0.56, offsetX: 40, offsetY: -76 },
      guide: { width: 320, minHeight: 144, anchorOffsetX: 24, overlap: 14 },
    },
    tablet: {
      primary: { x: 680, y: 212 },
      organization: { x: 88, y: 332 },
      parked: [
        { x: 592, y: 724 },
        { x: 972, y: 724 },
        { x: 1352, y: 724 },
      ],
      viewport: { zoom: 0.48, offsetX: 26, offsetY: -70 },
      guide: { width: 304, minHeight: 140, anchorOffsetX: 22, overlap: 14 },
    },
    mobile: {
      primary: { x: 72, y: 328 },
      organization: { x: 40, y: 72 },
      parked: [
        { x: 472, y: 680 },
        { x: 840, y: 700 },
      ],
      viewport: { zoom: 0.44, offsetX: 16, offsetY: -60 },
      guide: { width: 280, minHeight: 132, anchorOffsetX: 18, overlap: 12 },
    },
  },
  roadmap: {
    desktop: {
      primary: { x: 936, y: 208 },
      organization: { x: 124, y: 304 },
      parked: [
        { x: 616, y: 728 },
        { x: 1040, y: 728 },
        { x: 1504, y: 728 },
      ],
      viewport: { zoom: 0.58, offsetX: 34, offsetY: -72 },
      guide: { width: 320, minHeight: 144, anchorOffsetX: 24, overlap: 14 },
    },
    tablet: {
      primary: { x: 696, y: 232 },
      organization: { x: 96, y: 340 },
      parked: [
        { x: 608, y: 724 },
        { x: 988, y: 724 },
        { x: 1368, y: 724 },
      ],
      viewport: { zoom: 0.5, offsetX: 22, offsetY: -64 },
      guide: { width: 304, minHeight: 140, anchorOffsetX: 22, overlap: 14 },
    },
    mobile: {
      primary: { x: 80, y: 340 },
      organization: { x: 40, y: 72 },
      parked: [
        { x: 448, y: 680 },
        { x: 816, y: 704 },
      ],
      viewport: { zoom: 0.46, offsetX: 16, offsetY: -52 },
      guide: { width: 280, minHeight: 132, anchorOffsetX: 18, overlap: 12 },
    },
  },
  fundraising: {
    desktop: {
      primary: { x: 992, y: 232 },
      organization: { x: 128, y: 304 },
      parked: [
        { x: 632, y: 720 },
        { x: 1048, y: 720 },
        { x: 1512, y: 720 },
      ],
      viewport: { zoom: 0.6, offsetX: 28, offsetY: -60 },
      guide: { width: 320, minHeight: 144, anchorOffsetX: 24, overlap: 14 },
    },
    tablet: {
      primary: { x: 744, y: 256 },
      organization: { x: 96, y: 340 },
      parked: [
        { x: 616, y: 728 },
        { x: 996, y: 728 },
      ],
      viewport: { zoom: 0.54, offsetX: 18, offsetY: -52 },
      guide: { width: 304, minHeight: 140, anchorOffsetX: 22, overlap: 14 },
    },
    mobile: {
      primary: { x: 96, y: 372 },
      organization: { x: 40, y: 80 },
      parked: [{ x: 464, y: 704 }],
      viewport: { zoom: 0.5, offsetX: 14, offsetY: -42 },
      guide: { width: 280, minHeight: 132, anchorOffsetX: 18, overlap: 12 },
    },
  },
  communications: {
    desktop: {
      primary: { x: 944, y: 160 },
      organization: { x: 120, y: 300 },
      parked: [
        { x: 632, y: 744 },
        { x: 1056, y: 744 },
        { x: 1520, y: 744 },
      ],
      viewport: { zoom: 0.54, offsetX: 32, offsetY: -72 },
      guide: { width: 320, minHeight: 144, anchorOffsetX: 24, overlap: 14 },
    },
    tablet: {
      primary: { x: 700, y: 196 },
      organization: { x: 92, y: 340 },
      parked: [
        { x: 616, y: 744 },
        { x: 996, y: 744 },
      ],
      viewport: { zoom: 0.48, offsetX: 18, offsetY: -64 },
      guide: { width: 304, minHeight: 140, anchorOffsetX: 22, overlap: 14 },
    },
    mobile: {
      primary: { x: 88, y: 348 },
      organization: { x: 40, y: 72 },
      parked: [{ x: 456, y: 704 }],
      viewport: { zoom: 0.42, offsetX: 12, offsetY: -50 },
      guide: { width: 280, minHeight: 132, anchorOffsetX: 18, overlap: 12 },
    },
  },
}

export const SCENE_SLOT_LAYOUTS = createBoostedSceneSlotLayouts(
  BASE_SCENE_SLOT_LAYOUTS,
)
