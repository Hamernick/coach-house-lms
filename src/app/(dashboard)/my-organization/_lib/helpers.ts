import type { ModuleCardStatus } from "@/lib/accelerator/progress"
import { publicSharingEnabled } from "@/lib/feature-flags"
import type { OrgProfile, FormationStatus } from "@/components/organization/org-profile-card/types"

import type { FormationStepState, MyOrganizationSearchParams } from "./types"

type OrganizationRow = {
  ein: string | null
  public_slug: string | null
  is_public: boolean | null
} | null

const COMPACT_USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 0,
})

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

export function safeDateLabel(value: string, withTime = false) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Date pending"
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(date)
}

export function formatFundingGoal(cents: number) {
  if (!Number.isFinite(cents) || cents <= 0) return "Not set"
  return COMPACT_USD.format(cents / 100)
}

export function parseMonthParam(value: string) {
  const trimmed = value.trim()
  const match = /^(\d{4})-(\d{2})$/.exec(trimmed)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return null
  const date = new Date(year, month - 1, 1)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1) return null
  return date
}

function formatMonthParam(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

export function withMonthParam(
  params: MyOrganizationSearchParams | undefined,
  monthDate: Date,
) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params ?? {})) {
    if (key === "month") continue
    if (typeof value === "string" && value.trim()) {
      query.set(key, value)
      continue
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string" && item.trim()) {
          query.append(key, item)
        }
      }
    }
  }
  query.set("month", formatMonthParam(monthDate))
  return `/organization?${query.toString()}`
}

export function resolveFormationStepState(status: ModuleCardStatus): FormationStepState {
  if (status === "completed") return "completed"
  if (status === "in_progress") return "active"
  return "pending"
}

function isFormationStatus(value: unknown): value is FormationStatus {
  return value === "pre_501c3" || value === "in_progress" || value === "approved"
}

export function buildInitialOrganizationProfile({
  profile,
  organization,
}: {
  profile: Record<string, unknown>
  organization: OrganizationRow
}): OrgProfile {
  const formationStatusRaw = profile["formationStatus"]
  const formationStatus: FormationStatus = isFormationStatus(formationStatusRaw)
    ? formationStatusRaw
    : "in_progress"

  return {
    name: String(profile["name"] ?? ""),
    description: String(profile["description"] ?? profile["entity"] ?? ""),
    tagline: String(profile["tagline"] ?? ""),
    ein: String(organization?.ein ?? profile["ein"] ?? ""),
    formationStatus,
    rep: String(profile["rep"] ?? ""),
    email: String(profile["email"] ?? ""),
    phone: String(profile["phone"] ?? ""),
    address: String(profile["address"] ?? ""),
    addressStreet: String(profile["address_street"] ?? ""),
    addressCity: String(profile["address_city"] ?? ""),
    addressState: String(profile["address_state"] ?? ""),
    addressPostal: String(profile["address_postal"] ?? ""),
    addressCountry: String(profile["address_country"] ?? ""),
    logoUrl: String(profile["logoUrl"] ?? ""),
    headerUrl: String(profile["headerUrl"] ?? ""),
    publicUrl: String(profile["publicUrl"] ?? ""),
    twitter: String(profile["twitter"] ?? ""),
    facebook: String(profile["facebook"] ?? ""),
    linkedin: String(profile["linkedin"] ?? ""),
    instagram: String(profile["instagram"] ?? ""),
    youtube: String(profile["youtube"] ?? ""),
    tiktok: String(profile["tiktok"] ?? ""),
    newsletter: String(profile["newsletter"] ?? ""),
    github: String(profile["github"] ?? ""),
    vision: String(profile["vision"] ?? ""),
    mission: String(profile["mission"] ?? ""),
    need: String(profile["need"] ?? ""),
    values: String(profile["values"] ?? ""),
    programs: String(profile["programs"] ?? ""),
    reports: String(profile["reports"] ?? ""),
    boilerplate: String(profile["boilerplate"] ?? ""),
    brandPrimary: String(profile["brandPrimary"] ?? ""),
    brandColors: Array.isArray(profile["brandColors"])
      ? (profile["brandColors"] as unknown[]).map((color) => String(color))
      : [],
    publicSlug: String(organization?.public_slug ?? ""),
    isPublic: publicSharingEnabled ? Boolean(organization?.is_public ?? false) : false,
  }
}
