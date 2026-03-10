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
    subtitle: "Lesson sequence, media, and resources",
    fullHref: "/accelerator",
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
    title: "Deck",
    subtitle: "Single PDF or PPT canvas",
    fullHref: "/workspace/documents",
  },
  vault: {
    title: "Documents",
    subtitle: "Drop files and quickly review uploads",
    fullHref: "/workspace/documents",
  },
  atlas: {
    title: "Atlas",
    subtitle: "Locations and online footprint",
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
    id: "edge-organization-to-vault",
    source: "organization-overview",
    target: "vault",
  },
  {
    id: "edge-vault-to-accelerator",
    source: "vault",
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
