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
    fullHref: "/organization",
  },
  "formation-status": {
    title: "Accelerator",
    subtitle: "Lesson sequence, media, and resources",
    fullHref: "/accelerator",
  },
  "brand-kit": {
    title: "Brand Kit",
    subtitle: "Narrative assets and public voice",
    fullHref: "/organization?view=editor&tab=company",
  },
  "economic-engine": {
    title: "Economic Engine",
    subtitle: "Funding architecture and pipeline health",
    fullHref: "/organization?view=editor&tab=programs",
  },
  calendar: {
    title: "Calendar",
    subtitle: "Milestones, board cadence, and invites",
    fullHref: "/roadmap",
  },
  communications: {
    title: "Communications",
    subtitle: "Campaign cadence and publishing queue",
    fullHref: "/organization?view=editor&tab=company",
  },
  deck: {
    title: "Deck",
    subtitle: "Single PDF or PPT canvas",
    fullHref: "/organization/documents",
  },
  vault: {
    title: "Documents",
    subtitle: "Upload, review, and share key files",
    fullHref: "/organization/documents",
  },
  atlas: {
    title: "Atlas",
    subtitle: "Locations and online footprint",
    fullHref: "/organization?view=editor&tab=company",
  },
}

export const WORKSPACE_EDGE_SPECS: WorkspaceConnectionState[] = [
  {
    id: "edge-organization-to-formation",
    source: "organization-overview",
    target: "formation-status",
  },
  {
    id: "edge-organization-to-brand",
    source: "organization-overview",
    target: "brand-kit",
  },
  {
    id: "edge-formation-to-economic",
    source: "formation-status",
    target: "economic-engine",
  },
  {
    id: "edge-organization-to-calendar",
    source: "organization-overview",
    target: "calendar",
  },
  {
    id: "edge-organization-to-comms",
    source: "organization-overview",
    target: "communications",
  },
  {
    id: "edge-comms-to-economic",
    source: "communications",
    target: "economic-engine",
  },
]
