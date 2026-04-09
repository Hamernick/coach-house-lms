import type { WorkspaceCardId, WorkspaceConnectionState } from "./workspace-board-types"

export type WorkspaceCardMeta = {
  title: string
  subtitle: string
  fullHref: string
}

export const WORKSPACE_CARD_META: Record<WorkspaceCardId, WorkspaceCardMeta> = {
  "organization-overview": {
    title: "Organization",
    subtitle: "Identity and operating baseline",
    fullHref: "/workspace",
  },
  programs: {
    title: "Programs",
    subtitle: "Builder, previews, and active fundraising briefs",
    fullHref: "",
  },
  accelerator: {
    title: "Accelerator",
    subtitle: "Class tracks, modules, and resources",
    fullHref: "/workspace/accelerator",
  },
  roadmap: {
    title: "Roadmap",
    subtitle: "Strategic priorities, sequencing, and operating focus",
    fullHref: "/workspace/roadmap",
  },
  "brand-kit": {
    title: "Brand Kit",
    subtitle: "Logos, palette, and a reusable export pack",
    fullHref: "",
  },
  "economic-engine": {
    title: "Fundraising",
    subtitle: "Funding architecture and pipeline health",
    fullHref: "/workspace?view=editor&tab=programs",
  },
  calendar: {
    title: "Calendar",
    subtitle: "Milestones, board cadence, and invites",
    fullHref: "/workspace/roadmap",
  },
  communications: {
    title: "Communications",
    subtitle: "Brand basics, heat map, and publishing readiness",
    fullHref: "",
  },
  deck: {
    title: "Tasks",
    subtitle: "Roadmap priorities and accelerator classes in one surface",
    fullHref: "/workspace/accelerator",
  },
  atlas: {
    title: "Map",
    subtitle: "Public place, checklist, and launch readiness",
    fullHref: "/workspace?view=editor&tab=company",
  },
}

export const WORKSPACE_EDGE_SPECS: WorkspaceConnectionState[] = [
  {
    id: "edge-organization-to-programs",
    source: "organization-overview",
    target: "programs",
  },
  {
    id: "edge-organization-to-roadmap",
    source: "organization-overview",
    target: "roadmap",
  },
  {
    id: "edge-roadmap-to-deck",
    source: "roadmap",
    target: "deck",
  },
  {
    id: "edge-organization-to-atlas",
    source: "organization-overview",
    target: "atlas",
  },
  {
    id: "edge-roadmap-to-accelerator",
    source: "roadmap",
    target: "accelerator",
  },
  {
    id: "edge-deck-to-accelerator",
    source: "deck",
    target: "accelerator",
  },
  {
    id: "edge-accelerator-to-economic",
    source: "accelerator",
    target: "economic-engine",
  },
  {
    id: "edge-accelerator-to-calendar",
    source: "accelerator",
    target: "calendar",
  },
  {
    id: "edge-accelerator-to-comms",
    source: "accelerator",
    target: "communications",
  },
]
