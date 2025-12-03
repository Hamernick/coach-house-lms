import type { OrgPersonWithImage } from "@/components/people/supporters-showcase"

export type OrgProfile = {
  name?: string | null
  description?: string | null
  tagline?: string | null
  ein?: string | null
  rep?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  addressStreet?: string | null
  addressCity?: string | null
  addressState?: string | null
  addressPostal?: string | null
  addressCountry?: string | null
  logoUrl?: string | null
  publicUrl?: string | null
  twitter?: string | null
  facebook?: string | null
  linkedin?: string | null
  instagram?: string | null
  youtube?: string | null
  tiktok?: string | null
  newsletter?: string | null
  github?: string | null
  vision?: string | null
  mission?: string | null
  need?: string | null
  values?: string | null
  programs?: string | null
  reports?: string | null
  boilerplate?: string | null
  brandPrimary?: string | null
  brandColors?: string[] | null
  publicSlug?: string | null
  isPublic?: boolean | null
}

export type OrgProfileErrors = Record<string, string>

export type OrgProgram = {
  id: string
  title?: string | null
  subtitle?: string | null
  location?: string | null
  image_url?: string | null
  status_label?: string | null
  duration_label?: string | null
  features?: string[] | null
  goal_cents?: number | null
  raised_cents?: number | null
  is_public?: boolean | null
  created_at?: string | null
  start_date?: string | null
  end_date?: string | null
  address_city?: string | null
  address_state?: string | null
  address_country?: string | null
  cta_label?: string | null
  cta_url?: string | null
}

export type ProfileTab = "company" | "programs" | "reports" | "people" | "supporters"

export type SlugStatus = { available: boolean; suggestion?: string; message?: string } | null

export interface OrgProfileCardProps {
  initial: OrgProfile
  people: OrgPersonWithImage[]
  programs?: OrgProgram[]
  canEdit?: boolean
}
