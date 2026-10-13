/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { revalidatePath } from "next/cache"
import { requireServerSession } from "@/lib/auth"
import { publicSharingEnabled } from "@/lib/feature-flags"
import { PROGRAM_MEDIA_BUCKET, resolveProgramMediaCleanupPath } from "@/lib/storage/program-media"
import { canEditOrganization, resolveActiveOrganization } from "@/lib/organization/active-org"

export type CreateProgramPayload = {
  title: string
  subtitle?: string | null
  description?: string | null
  location?: string | null
  locationType?: "in_person" | "online" | null
  locationUrl?: string | null
  teamIds?: string[] | null
  addressStreet?: string | null
  addressCity?: string | null
  addressState?: string | null
  addressPostal?: string | null
  addressCountry?: string | null
  imageUrl?: string | null
  duration?: string | null
  startDate?: string | null
  endDate?: string | null
  features?: string[] | null
  statusLabel?: string | null
  goalCents?: number | null
  raisedCents?: number | null
  isPublic?: boolean | null
  ctaLabel?: string | null
  ctaUrl?: string | null
  wizardSnapshot?: Record<string, unknown> | null
}

type ProgramSeedStage = {
  title: string
  oneSentence: string
  programType: string
  coreFormat: string
  statusLabel: string
  budgetUsd: number
  raisedUsd: number
  peopleServed: number
  staffCount: number
  durationLabel: string
  frequency: string
  locationMode: "in_person" | "online" | "hybrid"
  locationDetails: string
  startMonthOffset: number
  outcomes: string[]
}

export type SeedDemoProgramResult =
  | {
      ok: true
      createdTitle: string
      statusLabel: string
      remaining: number
      total: number
    }
  | { error: string }

const DEMO_PROGRAM_PREFIX = "Demo Program - "

const DEMO_PROGRAM_STAGES: ProgramSeedStage[] = [
  {
    title: `${DEMO_PROGRAM_PREFIX}Board Readiness Bootcamp`,
    oneSentence: "Build board governance basics and launch a first board operating cadence.",
    programType: "Training & Capacity Building",
    coreFormat: "Cohort",
    statusLabel: "Planned",
    budgetUsd: 18000,
    raisedUsd: 0,
    peopleServed: 24,
    staffCount: 2,
    durationLabel: "8 weeks",
    frequency: "Weekly",
    locationMode: "hybrid",
    locationDetails: "Main office + Zoom",
    startMonthOffset: 1,
    outcomes: ["Board roles confirmed", "Meeting cadence active", "90-day workplan approved"],
  },
  {
    title: `${DEMO_PROGRAM_PREFIX}Community Intake Lab`,
    oneSentence: "Run a pilot intake cycle with participant screening and referral workflow.",
    programType: "Direct Services",
    coreFormat: "Drop-in Hours",
    statusLabel: "In progress",
    budgetUsd: 26000,
    raisedUsd: 12000,
    peopleServed: 40,
    staffCount: 3,
    durationLabel: "12 weeks",
    frequency: "Twice weekly",
    locationMode: "in_person",
    locationDetails: "South Side Hub",
    startMonthOffset: 0,
    outcomes: ["100 intake forms completed", "80 qualified participants", "Referral handoff under 72 hours"],
  },
  {
    title: `${DEMO_PROGRAM_PREFIX}Volunteer Network Activation`,
    oneSentence: "Mobilize and train neighborhood volunteers for recurring service delivery.",
    programType: "Community Support",
    coreFormat: "Peer Group",
    statusLabel: "Completed",
    budgetUsd: 12000,
    raisedUsd: 12000,
    peopleServed: 60,
    staffCount: 1,
    durationLabel: "10 weeks",
    frequency: "Biweekly",
    locationMode: "hybrid",
    locationDetails: "Community center + Slack",
    startMonthOffset: -2,
    outcomes: ["50 active volunteers", "Attendance > 75%", "Retention playbook documented"],
  },
  {
    title: `${DEMO_PROGRAM_PREFIX}Workforce Pathway Cohort`,
    oneSentence: "Pair workforce coaching with employer-aligned projects for participant placement.",
    programType: "Training & Capacity Building",
    coreFormat: "Workforce Pathway",
    statusLabel: "Applications Open",
    budgetUsd: 48000,
    raisedUsd: 8000,
    peopleServed: 30,
    staffCount: 3,
    durationLabel: "16 weeks",
    frequency: "Weekly",
    locationMode: "online",
    locationDetails: "Google Meet",
    startMonthOffset: 2,
    outcomes: ["30 accepted participants", "20 project completions", "15 paid placements targeted"],
  },
  {
    title: `${DEMO_PROGRAM_PREFIX}Site Expansion Pilot`,
    oneSentence: "Validate expansion assumptions before adding a second service location.",
    programType: "Research & Information",
    coreFormat: "Outreach Campaign",
    statusLabel: "Paused",
    budgetUsd: 22000,
    raisedUsd: 6000,
    peopleServed: 20,
    staffCount: 2,
    durationLabel: "6 weeks",
    frequency: "Weekly",
    locationMode: "in_person",
    locationDetails: "Prospective North Site",
    startMonthOffset: 3,
    outcomes: ["Site readiness scorecard complete", "Risk log updated", "Board go/no-go memo delivered"],
  },
]

function monthStartIsoWithOffset(offset: number) {
  const date = new Date()
  date.setUTCDate(1)
  date.setUTCHours(0, 0, 0, 0)
  date.setUTCMonth(date.getUTCMonth() + offset)
  return date.toISOString()
}

export async function createProgramAction(payload: CreateProgramPayload) {
  const { supabase, session } = await requireServerSession("/organization")
  const userId = session.user.id
  const { orgId, role } = await resolveActiveOrganization(supabase, userId)
  const canEdit = canEditOrganization(role)
  if (!canEdit) return { error: "Forbidden" }
  const allowPublicSharing = publicSharingEnabled

  const insert = {
    user_id: orgId,
    title: payload.title,
    subtitle: payload.subtitle ?? null,
    description: payload.description ?? null,
    location: payload.location ?? null,
    location_type: payload.locationType ?? "in_person",
    location_url: payload.locationUrl ?? null,
    team_ids: payload.teamIds ?? [],
    address_street: payload.addressStreet ?? null,
    address_city: payload.addressCity ?? null,
    address_state: payload.addressState ?? null,
    address_postal: payload.addressPostal ?? null,
    address_country: payload.addressCountry ?? null,
    image_url: payload.imageUrl ?? null,
    duration_label: payload.duration ?? null,
    start_date: payload.startDate ? new Date(payload.startDate).toISOString() as unknown as any : null,
    end_date: payload.endDate ? new Date(payload.endDate).toISOString() as unknown as any : null,
    features: payload.features ?? [],
    status_label: payload.statusLabel ?? null,
    goal_cents: payload.goalCents ?? 0,
    raised_cents: payload.raisedCents ?? 0,
    is_public: allowPublicSharing ? Boolean(payload.isPublic ?? false) : false,
    cta_label: payload.ctaLabel ?? null,
    cta_url: payload.ctaUrl ?? null,
    wizard_snapshot: payload.wizardSnapshot ?? {},
  }

  let { error } = await (supabase.from("programs") as any).insert(insert)
  if (error && /wizard_snapshot/i.test(error.message)) {
    const legacyInsert = { ...insert }
    delete (legacyInsert as { wizard_snapshot?: unknown }).wizard_snapshot
    const retry = await (supabase.from("programs") as any).insert(legacyInsert)
    error = retry.error
  }
  if (error) return { error: error.message }
  await revalidateOrganizationProgramViews(supabase, orgId)
  return { ok: true }
}

export type UpdateProgramPayload = Partial<CreateProgramPayload>

export async function updateProgramAction(id: string, payload: UpdateProgramPayload) {
  const { supabase, session } = await requireServerSession("/organization")
  const userId = session.user.id
  const { orgId, role } = await resolveActiveOrganization(supabase, userId)
  const canEdit = canEditOrganization(role)
  if (!canEdit) return { error: "Forbidden" }
  const allowPublicSharing = publicSharingEnabled
  const imageTouched = Object.prototype.hasOwnProperty.call(payload, "imageUrl")
  const hasKey = (key: keyof UpdateProgramPayload) =>
    Object.prototype.hasOwnProperty.call(payload, key)
  const pick = <K extends keyof UpdateProgramPayload>(key: K): UpdateProgramPayload[K] | undefined =>
    hasKey(key) ? payload[key] : undefined

  let previousImageUrl: string | null = null
  if (imageTouched) {
    const { data: existing, error: existingError } = await (supabase
      .from("programs") as any)
      .select("image_url")
      .eq("id", id)
      .eq("user_id", orgId)
      .maybeSingle()

    if (existingError) return { error: existingError.message }
    const existingRow = existing as { image_url?: string | null } | null
    previousImageUrl = existingRow?.image_url ?? null
  }

  const startDate = pick("startDate")
  const endDate = pick("endDate")
  const isPublic = pick("isPublic")

  const update = {
    title: pick("title"),
    subtitle: pick("subtitle"),
    description: pick("description"),
    location: pick("location"),
    location_type: pick("locationType") ?? undefined,
    location_url: pick("locationUrl"),
    team_ids: pick("teamIds") ?? undefined,
    address_street: pick("addressStreet"),
    address_city: pick("addressCity"),
    address_state: pick("addressState"),
    address_postal: pick("addressPostal"),
    address_country: pick("addressCountry"),
    image_url: payload.imageUrl === null ? null : payload.imageUrl ?? undefined,
    duration_label: pick("duration"),
    start_date:
      startDate === undefined ? undefined : startDate ? (new Date(startDate).toISOString() as unknown as any) : null,
    end_date:
      endDate === undefined ? undefined : endDate ? (new Date(endDate).toISOString() as unknown as any) : null,
    features: pick("features"),
    status_label: pick("statusLabel"),
    goal_cents: pick("goalCents"),
    raised_cents: pick("raisedCents"),
    is_public: isPublic === undefined ? undefined : allowPublicSharing ? Boolean(isPublic) : false,
    cta_label: pick("ctaLabel"),
    cta_url: pick("ctaUrl"),
    wizard_snapshot: hasKey("wizardSnapshot") ? (payload.wizardSnapshot ?? {}) : undefined,
  }

  let { error } = await (supabase
    .from("programs") as any)
    .update(update)
    .eq("id", id)
    .eq("user_id", orgId)

  if (error && /wizard_snapshot/i.test(error.message)) {
    const legacyUpdate = { ...update }
    delete (legacyUpdate as { wizard_snapshot?: unknown }).wizard_snapshot
    const retry = await (supabase
      .from("programs") as any)
      .update(legacyUpdate)
      .eq("id", id)
      .eq("user_id", orgId)
    error = retry.error
  }

  if (error) return { error: error.message }

  if (imageTouched) {
    const cleanupPath = resolveProgramMediaCleanupPath({
      previousUrl: previousImageUrl,
      nextUrl: payload.imageUrl ?? null,
      userId: orgId,
    })
    if (cleanupPath) {
      await supabase.storage.from(PROGRAM_MEDIA_BUCKET).remove([cleanupPath])
    }
  }
  await revalidateOrganizationProgramViews(supabase, orgId)
  return { ok: true }
}

export async function seedNextDemoProgramAction(): Promise<SeedDemoProgramResult> {
  const { supabase, session } = await requireServerSession("/organization")
  const userId = session.user.id
  const { orgId, role } = await resolveActiveOrganization(supabase, userId)
  const canEdit = canEditOrganization(role)
  if (!canEdit) return { error: "Forbidden" }

  const { data: existingRows, error: existingError } = await (supabase
    .from("programs") as any)
    .select("title")
    .eq("user_id", orgId)
    .like("title", `${DEMO_PROGRAM_PREFIX}%`)

  if (existingError) return { error: existingError.message }

  const existingTitles = new Set<string>(
    (Array.isArray(existingRows) ? existingRows : [])
      .map((row) => (typeof row?.title === "string" ? row.title : ""))
      .filter(Boolean),
  )

  const nextStage = DEMO_PROGRAM_STAGES.find((stage) => !existingTitles.has(stage.title))
  if (!nextStage) {
    return { error: "All demo program stages are already seeded." }
  }

  const wizardSnapshot = {
    version: 1,
    title: nextStage.title,
    oneSentence: nextStage.oneSentence,
    subtitle: "",
    programType: nextStage.programType,
    coreFormat: nextStage.coreFormat,
    formatAddons: [],
    servesWho: "Local nonprofit operators and board members",
    eligibilityRules: "",
    participantReceive1: "Guided implementation support",
    participantReceive2: "Templates and documentation",
    participantReceive3: "Weekly accountability check-ins",
    participantReceives: [
      "Guided implementation support",
      "Templates and documentation",
      "Weekly accountability check-ins",
    ],
    successOutcome1: nextStage.outcomes[0] ?? "",
    successOutcome2: nextStage.outcomes[1] ?? "",
    successOutcome3: nextStage.outcomes[2] ?? "",
    successOutcomes: nextStage.outcomes,
    pilotPeopleServed: nextStage.peopleServed,
    staffCount: nextStage.staffCount,
    volunteerCount: 2,
    staffRoles: [
      { role: "Program Lead", hoursPerWeek: 20 },
      { role: "Operations Coordinator", hoursPerWeek: 15 },
    ],
    startMonth: monthStartIsoWithOffset(nextStage.startMonthOffset).slice(0, 7),
    durationLabel: nextStage.durationLabel,
    frequency: nextStage.frequency,
    locationMode: nextStage.locationMode,
    locationDetails: nextStage.locationDetails,
    budgetUsd: nextStage.budgetUsd,
    costStaffUsd: Math.round(nextStage.budgetUsd * 0.6),
    costSpaceUsd: Math.round(nextStage.budgetUsd * 0.18),
    costMaterialsUsd: Math.round(nextStage.budgetUsd * 0.14),
    costOtherUsd: Math.round(nextStage.budgetUsd * 0.08),
    fundingSource: "Demo data seed",
    ctaLabel: "View details",
    ctaUrl: "",
    statusLabel: nextStage.statusLabel,
    metrics: {
      costPerParticipant: nextStage.budgetUsd / Math.max(1, nextStage.peopleServed),
      participantsPerStaff: nextStage.peopleServed / Math.max(1, nextStage.staffCount),
    },
    seed: { template: "program-stage", titlePrefix: DEMO_PROGRAM_PREFIX },
    updatedAt: new Date().toISOString(),
  }

  const insert = {
    user_id: orgId,
    title: nextStage.title,
    subtitle: "",
    description: nextStage.oneSentence,
    location: nextStage.locationDetails,
    location_type: nextStage.locationMode === "online" ? "online" : "in_person",
    location_url: null,
    team_ids: [],
    address_street: null,
    address_city: null,
    address_state: null,
    address_postal: null,
    address_country: null,
    image_url: null,
    duration_label: nextStage.durationLabel,
    start_date: monthStartIsoWithOffset(nextStage.startMonthOffset),
    end_date: null,
    features: [nextStage.programType, nextStage.coreFormat],
    status_label: nextStage.statusLabel,
    goal_cents: nextStage.budgetUsd * 100,
    raised_cents: nextStage.raisedUsd * 100,
    is_public: false,
    cta_label: "View details",
    cta_url: null,
    wizard_snapshot: wizardSnapshot,
  }

  let { error: insertError } = await (supabase.from("programs") as any).insert(insert)
  if (insertError && /wizard_snapshot/i.test(insertError.message)) {
    const legacyInsert = { ...insert }
    delete (legacyInsert as { wizard_snapshot?: unknown }).wizard_snapshot
    const retry = await (supabase.from("programs") as any).insert(legacyInsert)
    insertError = retry.error
  }
  if (insertError) return { error: insertError.message }

  await revalidateOrganizationProgramViews(supabase, orgId)

  const seededCount = existingTitles.size + 1
  return {
    ok: true,
    createdTitle: nextStage.title,
    statusLabel: nextStage.statusLabel,
    remaining: Math.max(0, DEMO_PROGRAM_STAGES.length - seededCount),
    total: DEMO_PROGRAM_STAGES.length,
  }
}

async function revalidateOrganizationProgramViews(supabase: Awaited<ReturnType<typeof requireServerSession>>["supabase"], userId: string) {
  revalidatePath("/organization")
  try {
    const { data, error } = await supabase
      .from("organizations")
      .select("public_slug, is_public")
      .eq("user_id", userId)
      .maybeSingle<{ public_slug: string | null; is_public: boolean | null }>()

    if (error) return

    const slug = typeof data?.public_slug === "string" && data.public_slug.length > 0 ? data.public_slug : null
    const isPublic = Boolean(data?.is_public)

    if (isPublic) revalidatePath("/community")
    if (slug) revalidatePath(`/${slug}`)
  } catch {
    // Swallow revalidation errors; they should not block program writes.
  }
}
 
