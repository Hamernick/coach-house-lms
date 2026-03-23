import type { WorkspaceCanvasTutorialStepId } from "@/features/workspace-canvas-tutorial"

export type WorkspaceMapOrganizationProfile = {
  name?: string | null
  tagline?: string | null
  vision?: string | null
  mission?: string | null
  values?: string | null
  address?: string | null
  addressStreet?: string | null
  addressCity?: string | null
  addressState?: string | null
  addressPostal?: string | null
  addressCountry?: string | null
  logoUrl?: string | null
}

export type WorkspaceMapChecklistItem = {
  id: "story" | "identity" | "logo"
  label: string
  detail: string
  href: string
  complete: boolean
}

export type WorkspaceMapResolvedLocation = {
  lat: number
  lng: number
  label: string
  source: "organization" | "viewer"
}

export type WorkspaceMapCardInput = {
  orgId: string
  title: string
  profile: WorkspaceMapOrganizationProfile
  companyHref: string
  presentationMode: boolean
  tutorialStepId?: WorkspaceCanvasTutorialStepId | null
}
