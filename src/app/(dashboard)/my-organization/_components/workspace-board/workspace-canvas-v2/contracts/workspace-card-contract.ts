"use client"

import type { WorkspaceCardSize } from "../../workspace-board-types"

export const WORKSPACE_CANVAS_V2_CARD_IDS = [
  "organization-overview",
  "programs",
  "vault",
  "accelerator",
  "brand-kit",
  "economic-engine",
  "calendar",
  "communications",
] as const

export type WorkspaceCanvasV2CardId = (typeof WORKSPACE_CANVAS_V2_CARD_IDS)[number]

export const WORKSPACE_CARD_PORT_TYPES = [
  "workspace-link",
  "organization-context",
  "program-plan",
  "tasks",
  "brand-assets",
  "financial-model",
  "schedule",
  "campaign",
  "documents",
] as const

export type WorkspaceCardPortType = (typeof WORKSPACE_CARD_PORT_TYPES)[number]

export type WorkspaceCanvasCardPorts = {
  inputs: readonly WorkspaceCardPortType[]
  outputs: readonly WorkspaceCardPortType[]
}

export type WorkspaceCanvasCardScrollPolicy = "single-region" | "none"
export type WorkspaceCanvasHubRole = "center" | "ring" | "outer"
export type WorkspaceCanvasTimelineRole = "root" | "lane" | "branch"
export type WorkspaceCanvasRailRole = "root" | "trunk" | "leaf"
export type WorkspaceCanvasRootBehavior = "fixed" | "toggle"

export type WorkspaceCanvasCardRailMeta = {
  label: string
  order: number
  enabled: boolean
  rootBehavior: WorkspaceCanvasRootBehavior
  parentId: WorkspaceCanvasV2CardId | null
  role: WorkspaceCanvasRailRole
}

export type WorkspaceCanvasV2CardContract = {
  id: WorkspaceCanvasV2CardId
  laneIndex: number
  defaultPosition: { x: number; y: number }
  dockEnabled: boolean
  allowedSizes: readonly WorkspaceCardSize[]
  defaultSize: WorkspaceCardSize
  scrollPolicy: WorkspaceCanvasCardScrollPolicy
  layoutRoles: {
    hub: WorkspaceCanvasHubRole
    timeline: WorkspaceCanvasTimelineRole
  }
  ports: WorkspaceCanvasCardPorts
  rail: WorkspaceCanvasCardRailMeta
}

export const WORKSPACE_CANVAS_V2_CARD_CONTRACT = Object.freeze({
  "organization-overview": {
    id: "organization-overview",
    laneIndex: 0,
    defaultPosition: { x: 120, y: 208 },
    dockEnabled: true,
    allowedSizes: ["md", "lg"],
    defaultSize: "md",
    scrollPolicy: "none",
    layoutRoles: {
      hub: "ring",
      timeline: "root",
    },
    ports: {
      inputs: ["workspace-link"],
      outputs: ["organization-context", "workspace-link"],
    },
    rail: {
      label: "Org",
      order: 0,
      enabled: true,
      rootBehavior: "fixed",
      parentId: null,
      role: "root",
    },
  },
  programs: {
    id: "programs",
    laneIndex: 1,
    defaultPosition: { x: 632, y: 208 },
    dockEnabled: true,
    allowedSizes: ["md", "lg"],
    defaultSize: "md",
    scrollPolicy: "none",
    layoutRoles: {
      hub: "ring",
      timeline: "lane",
    },
    ports: {
      inputs: ["organization-context", "workspace-link"],
      outputs: ["program-plan", "workspace-link"],
    },
    rail: {
      label: "Programs",
      order: 3,
      enabled: true,
      rootBehavior: "toggle",
      parentId: "organization-overview",
      role: "trunk",
    },
  },
  accelerator: {
    id: "accelerator",
    laneIndex: 3,
    defaultPosition: { x: 1656, y: 208 },
    dockEnabled: true,
    allowedSizes: ["sm", "md", "lg"],
    defaultSize: "sm",
    scrollPolicy: "none",
    layoutRoles: {
      hub: "ring",
      timeline: "lane",
    },
    ports: {
      inputs: ["organization-context", "workspace-link"],
      outputs: ["program-plan", "tasks", "workspace-link"],
    },
    rail: {
      label: "Accelerator",
      order: 1,
      enabled: true,
      rootBehavior: "toggle",
      parentId: "vault",
      role: "trunk",
    },
  },
  "brand-kit": {
    id: "brand-kit",
    laneIndex: 7,
    defaultPosition: { x: 2168, y: 600 },
    dockEnabled: false,
    allowedSizes: ["sm", "md"],
    defaultSize: "sm",
    scrollPolicy: "single-region",
    layoutRoles: {
      hub: "ring",
      timeline: "lane",
    },
    ports: {
      inputs: ["organization-context", "workspace-link"],
      outputs: ["brand-assets", "workspace-link"],
    },
    rail: {
      label: "Brand",
      order: 7,
      enabled: false,
      rootBehavior: "toggle",
      parentId: "communications",
      role: "leaf",
    },
  },
  "economic-engine": {
    id: "economic-engine",
    laneIndex: 5,
    defaultPosition: { x: 2680, y: 208 },
    dockEnabled: true,
    allowedSizes: ["sm", "md"],
    defaultSize: "md",
    scrollPolicy: "single-region",
    layoutRoles: {
      hub: "ring",
      timeline: "lane",
    },
    ports: {
      inputs: ["organization-context", "brand-assets", "workspace-link"],
      outputs: ["financial-model", "workspace-link"],
    },
    rail: {
      label: "Engine",
      order: 5,
      enabled: true,
      rootBehavior: "toggle",
      parentId: "accelerator",
      role: "leaf",
    },
  },
  calendar: {
    id: "calendar",
    laneIndex: 6,
    defaultPosition: { x: 3192, y: 208 },
    dockEnabled: true,
    allowedSizes: ["sm", "md"],
    defaultSize: "sm",
    scrollPolicy: "single-region",
    layoutRoles: {
      hub: "ring",
      timeline: "lane",
    },
    ports: {
      inputs: ["program-plan", "tasks", "workspace-link"],
      outputs: ["schedule", "workspace-link"],
    },
    rail: {
      label: "Calendar",
      order: 2,
      enabled: true,
      rootBehavior: "toggle",
      parentId: "accelerator",
      role: "leaf",
    },
  },
  communications: {
    id: "communications",
    laneIndex: 4,
    defaultPosition: { x: 2168, y: 208 },
    dockEnabled: true,
    allowedSizes: ["md", "lg"],
    defaultSize: "md",
    scrollPolicy: "single-region",
    layoutRoles: {
      hub: "ring",
      timeline: "lane",
    },
    ports: {
      inputs: ["brand-assets", "schedule", "workspace-link"],
      outputs: ["campaign", "workspace-link"],
    },
    rail: {
      label: "Communications",
      order: 6,
      enabled: true,
      rootBehavior: "toggle",
      parentId: "accelerator",
      role: "leaf",
    },
  },
  vault: {
    id: "vault",
    laneIndex: 2,
    defaultPosition: { x: 1144, y: 208 },
    dockEnabled: true,
    allowedSizes: ["sm", "md", "lg"],
    defaultSize: "sm",
    scrollPolicy: "single-region",
    layoutRoles: {
      hub: "center",
      timeline: "lane",
    },
    ports: {
      inputs: [
        "workspace-link",
        "organization-context",
        "program-plan",
        "tasks",
        "brand-assets",
        "financial-model",
        "schedule",
        "campaign",
      ],
      outputs: ["documents", "workspace-link"],
    },
    rail: {
      label: "Docs",
      order: 4,
      enabled: true,
      rootBehavior: "toggle",
      parentId: "organization-overview",
      role: "trunk",
    },
  },
} satisfies Record<WorkspaceCanvasV2CardId, WorkspaceCanvasV2CardContract>)

export const WORKSPACE_CANVAS_V2_DEFAULT_POSITIONS = Object.freeze({
  "organization-overview":
    WORKSPACE_CANVAS_V2_CARD_CONTRACT["organization-overview"].defaultPosition,
  programs: WORKSPACE_CANVAS_V2_CARD_CONTRACT.programs.defaultPosition,
  accelerator: WORKSPACE_CANVAS_V2_CARD_CONTRACT.accelerator.defaultPosition,
  "brand-kit": WORKSPACE_CANVAS_V2_CARD_CONTRACT["brand-kit"].defaultPosition,
  "economic-engine":
    WORKSPACE_CANVAS_V2_CARD_CONTRACT["economic-engine"].defaultPosition,
  calendar: WORKSPACE_CANVAS_V2_CARD_CONTRACT.calendar.defaultPosition,
  communications: WORKSPACE_CANVAS_V2_CARD_CONTRACT.communications.defaultPosition,
  vault: WORKSPACE_CANVAS_V2_CARD_CONTRACT.vault.defaultPosition,
} satisfies Record<WorkspaceCanvasV2CardId, { x: number; y: number }>)

export function resolveWorkspaceCanvasRailCardIds() {
  return [...WORKSPACE_CANVAS_V2_CARD_IDS].filter(
    (cardId) => WORKSPACE_CANVAS_V2_CARD_CONTRACT[cardId].rail.enabled,
  )
}

export const WORKSPACE_CANVAS_V2_RAIL_CARD_IDS = [
  ...resolveWorkspaceCanvasRailCardIds(),
] as readonly WorkspaceCanvasV2CardId[]

export const WORKSPACE_CANVAS_V2_DOCK_CARD_IDS = [
  ...WORKSPACE_CANVAS_V2_RAIL_CARD_IDS,
] as readonly WorkspaceCanvasV2CardId[]
