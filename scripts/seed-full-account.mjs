#!/usr/bin/env node
// Seeds a complete end-to-end demo account for launch QA.
// - Creates (or updates) auth user
// - Marks onboarding complete
// - Seeds organization profile + people
// - Seeds subscription + accelerator purchase variant
// - Seeds programs, notifications, calendar events
// - Seeds enrollments + module progress + notes
//
// Usage:
//   node scripts/seed-full-account.mjs --email demo@example.com --password 'TempPass!123' --variant with_coaching
//
// Variants:
//   with_coaching | without_coaching | none

import fs from "node:fs"
import path from "node:path"
import { createClient } from "@supabase/supabase-js"

function parseArgs(argv) {
  const parsed = {}
  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index]
    if (!token?.startsWith("--")) continue
    const key = token.slice(2)
    const next = argv[index + 1]
    if (!next || next.startsWith("--")) {
      parsed[key] = "true"
      continue
    }
    parsed[key] = next
    index += 1
  }
  return parsed
}

function hasTruthyFlag(value) {
  if (value == null) return false
  const normalized = String(value).trim().toLowerCase()
  return normalized === "true" || normalized === "1" || normalized === "yes"
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const content = fs.readFileSync(filePath, "utf8")
  const result = {}
  for (const rawLine of content.split(/\r?\n/g)) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#")) continue
    const equals = line.indexOf("=")
    if (equals <= 0) continue
    const key = line.slice(0, equals).trim()
    let value = line.slice(equals + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    result[key] = value
  }
  return result
}

function resolveEnv(key, envSources) {
  for (const source of envSources) {
    const value = source?.[key]
    if (value != null && String(value).length > 0) return String(value)
  }
  return ""
}

function rand(n = 8) {
  return Math.random().toString(36).slice(2, 2 + n)
}

function generateStrongTempPassword() {
  return `TempPass!A1${rand(10)}`
}

function slugify(input) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
}

function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function monthStartIso(offsetMonths = 0) {
  const date = new Date()
  date.setUTCDate(1)
  date.setUTCHours(0, 0, 0, 0)
  date.setUTCMonth(date.getUTCMonth() + offsetMonths)
  return date.toISOString()
}

const SEEDED_DOCUMENTS = {
  verificationLetter: {
    name: "IRS Verification Letter.pdf",
    path: "seed/verification-letter.pdf",
    size: 245_102,
    mime: "application/pdf",
    updatedAt: "2026-01-18T15:45:00.000Z",
  },
  articlesOfIncorporation: {
    name: "Articles of Incorporation.pdf",
    path: "seed/articles-of-incorporation.pdf",
    size: 312_991,
    mime: "application/pdf",
    updatedAt: "2026-01-12T20:11:00.000Z",
  },
  bylaws: {
    name: "Board Bylaws.pdf",
    path: "seed/bylaws.pdf",
    size: 194_874,
    mime: "application/pdf",
    updatedAt: "2026-01-14T13:03:00.000Z",
  },
  stateRegistration: {
    name: "State Registration.pdf",
    path: "seed/state-registration.pdf",
    size: 228_550,
    mime: "application/pdf",
    updatedAt: "2026-01-20T10:02:00.000Z",
  },
  goodStandingCertificate: {
    name: "Certificate of Good Standing.pdf",
    path: "seed/good-standing-certificate.pdf",
    size: 137_009,
    mime: "application/pdf",
    updatedAt: "2026-01-21T11:33:00.000Z",
  },
  w9: {
    name: "W9.pdf",
    path: "seed/w9.pdf",
    size: 85_129,
    mime: "application/pdf",
    updatedAt: "2026-01-16T16:47:00.000Z",
  },
}

const ROADMAP_CASE_STUDY_SECTIONS = [
  {
    id: "origin_story",
    title: "Origin Story",
    subtitle: "Why the organization started and what we observed first.",
    slug: "origin-story",
    status: "complete",
    content:
      "Bright Futures began after our founders tracked recurring school absences among middle-school students caring for younger siblings. Families repeatedly asked for practical support, not more referrals. We launched a small volunteer pilot with evening tutoring, childcare coordination, and parent navigation. Within one semester, participating students raised attendance by double digits and caregivers reported lower stress. That pilot became our proof point: when families get coordinated support, academic outcomes improve quickly.",
  },
  {
    id: "need",
    title: "Need",
    subtitle: "The local gap in coordinated student and caregiver support.",
    slug: "need",
    status: "complete",
    content:
      "Our service area has high rates of chronic absenteeism and low household access to after-school supervision. Public systems offer pieces of help, but families still navigate fragmented programs. Students lose instruction time while caregivers lose work hours. Existing services often require transportation and schedule flexibility that families do not have. Our model addresses this by combining tutoring, case navigation, and caregiver support in one operating rhythm.",
  },
  {
    id: "mission_vision_values",
    title: "Mission, Vision, Values",
    subtitle: "Mission clarity and decision principles for growth.",
    slug: "mission-vision-values",
    status: "complete",
    content:
      "Mission: We help families stabilize learning routines so students can thrive. Vision: Every student in our region has reliable support beyond school hours. Values: dignity, accountability, transparency, and measurable improvement. These values shape staffing, partner selection, and program design. We prioritize interventions that are practical for caregivers and measurable for schools.",
  },
  {
    id: "theory_of_change",
    title: "Theory of Change",
    subtitle: "Inputs, activities, and outcomes we validate each cohort.",
    slug: "theory-of-change",
    status: "in_progress",
    content:
      "If we pair structured tutoring with caregiver support and referral navigation, then student attendance and assignment completion improve, leading to stronger term performance. Inputs include trained volunteers, community partner referrals, and a case-management cadence. We measure weekly attendance, assignment completion, and caregiver follow-through on action plans. We are currently tightening our assumptions around retention in months 3-4.",
  },
  {
    id: "program",
    title: "Program",
    subtitle: "Program design, delivery cadence, and participation targets.",
    slug: "program",
    status: "in_progress",
    content:
      "We run two core offerings: Board Readiness Bootcamp for governance capacity and Community Intake Lab for family-facing delivery systems. Each cohort includes intake, baseline assessment, weekly support sessions, and monthly outcomes review. We target 40 families per quarter in the current phase, then scale to 120 with additional staff capacity.",
  },
  {
    id: "evaluation",
    title: "Evaluation",
    subtitle: "Measurement stack and review cadence.",
    slug: "evaluation",
    status: "in_progress",
    content:
      "Our evaluation stack combines attendance records, assignment completion, and caregiver check-in scores. Program leads review indicators weekly and run monthly retrospective sessions to identify workflow bottlenecks. We also track partner response times and referral closure rates to improve external coordination.",
  },
  {
    id: "people",
    title: "People",
    subtitle: "Current team and near-term hiring plan.",
    slug: "people",
    status: "not_started",
    content: "",
  },
  {
    id: "budget",
    title: "Budget",
    subtitle: "Current budget and phase-one investment priorities.",
    slug: "budget",
    status: "not_started",
    content: "",
  },
  {
    id: "fundraising",
    title: "Fundraising",
    subtitle: "Funding channels and target outcomes.",
    slug: "fundraising",
    status: "not_started",
    content: "",
  },
  {
    id: "next_actions",
    title: "Next Actions",
    subtitle: "30-90 day operating priorities and owners.",
    slug: "next-actions",
    status: "in_progress",
    content:
      "1) Finalize board packet and governance calendar. 2) Complete staffing plan for the next cohort. 3) Publish partner outreach playbook and assign owner-level follow-up cadence. 4) Submit two foundation applications with updated outcomes table.",
  },
]
const ROADMAP_STATUS_VALUES = new Set(["not_started", "in_progress", "complete"])
const REQUIRED_ROADMAP_SECTION_IDS = new Set([
  "origin_story",
  "need",
  "mission_vision_values",
  "theory_of_change",
  "program",
])
const REQUIRED_DOCUMENT_KEYS = new Set(["verificationLetter"])
const REQUIRED_ORG_PROFILE_KEYS = new Set([
  "name",
  "tagline",
  "description",
  "mission",
  "formationStatus",
  "documents",
  "roadmap",
  "org_people",
  "timezone",
])

function buildOrgPeople({
  ownerUserId,
  ownerName,
  ownerEmail,
  staffUserId,
  staffEmail,
  boardUserId,
  boardEmail,
}) {
  const FIRST_NAMES = [
    "Avery",
    "Jordan",
    "Maya",
    "Leslie",
    "Riley",
    "Quinn",
    "Sasha",
    "Devon",
    "Kai",
    "Taylor",
    "Parker",
    "Skyler",
    "Morgan",
    "Harper",
    "Reese",
    "Casey",
    "Rowan",
    "Elliot",
  ]
  const LAST_NAMES = [
    "Coleman",
    "Ellis",
    "Brooks",
    "Monroe",
    "Martinez",
    "Nguyen",
    "Patel",
    "Foster",
    "Chavez",
    "Bailey",
    "Kim",
    "Singh",
    "Davis",
    "Hernandez",
    "Lopez",
    "Thompson",
    "Reed",
    "Gray",
  ]

  const seededName = (seed) => {
    const first = FIRST_NAMES[seed % FIRST_NAMES.length]
    const last = LAST_NAMES[(seed * 7 + 3) % LAST_NAMES.length]
    return `${first} ${last}`
  }

  const person = ({
    id,
    name,
    title,
    email,
    category,
    reportsToId = null,
  }) => ({
    id,
    name,
    title,
    email,
    linkedin: null,
    category,
    image: null,
    reportsToId,
    pos: null,
  })

  const people = [
    person({
      id: ownerUserId,
      name: ownerName,
      title: "Executive Director",
      email: ownerEmail,
      category: "staff",
    }),
    person({
      id: staffUserId,
      name: "Jordan Staff",
      title: "Operations Manager",
      email: staffEmail,
      category: "staff",
      reportsToId: ownerUserId,
    }),
    person({
      id: boardUserId,
      name: "Casey Board",
      title: "Board Chair",
      email: boardEmail,
      category: "governing_board",
    }),
  ]

  const staffLeadIds = []
  for (let idx = 1; idx <= 10; idx += 1) {
    const id = `seed-staff-lead-${idx}`
    staffLeadIds.push(id)
    people.push(
      person({
        id,
        name: seededName(100 + idx),
        title: "Team Lead",
        email: `${id}@seed.example.com`,
        category: "staff",
        reportsToId: ownerUserId,
      }),
    )
  }

  for (let idx = 1; idx <= 58; idx += 1) {
    const leadId = staffLeadIds[(idx - 1) % staffLeadIds.length]
    const id = `seed-staff-${idx}`
    people.push(
      person({
        id,
        name: seededName(200 + idx),
        title: idx % 4 === 0 ? "Program Manager" : "Program Specialist",
        email: `${id}@seed.example.com`,
        category: "staff",
        reportsToId: leadId,
      }),
    )
  }

  for (let idx = 1; idx <= 14; idx += 1) {
    const id = `seed-board-${idx}`
    people.push(
      person({
        id,
        name: seededName(300 + idx),
        title: "Board Member",
        email: `${id}@seed.example.com`,
        category: "governing_board",
        reportsToId: boardUserId,
      }),
    )
  }

  const advisoryLeadIds = []
  for (let idx = 1; idx <= 4; idx += 1) {
    const id = `seed-advisory-lead-${idx}`
    advisoryLeadIds.push(id)
    people.push(
      person({
        id,
        name: seededName(400 + idx),
        title: "Advisory Lead",
        email: `${id}@seed.example.com`,
        category: "advisory_board",
      }),
    )
  }

  for (let idx = 1; idx <= 16; idx += 1) {
    const leadId = advisoryLeadIds[(idx - 1) % advisoryLeadIds.length]
    const id = `seed-advisory-${idx}`
    people.push(
      person({
        id,
        name: seededName(500 + idx),
        title: "Advisory Member",
        email: `${id}@seed.example.com`,
        category: "advisory_board",
        reportsToId: leadId,
      }),
    )
  }

  const volunteerLeadIds = []
  for (let idx = 1; idx <= 6; idx += 1) {
    const id = `seed-volunteer-lead-${idx}`
    volunteerLeadIds.push(id)
    people.push(
      person({
        id,
        name: seededName(600 + idx),
        title: "Volunteer Lead",
        email: `${id}@seed.example.com`,
        category: "volunteers",
      }),
    )
  }

  for (let idx = 1; idx <= 24; idx += 1) {
    const leadId = volunteerLeadIds[(idx - 1) % volunteerLeadIds.length]
    const id = `seed-volunteer-${idx}`
    people.push(
      person({
        id,
        name: seededName(700 + idx),
        title: "Volunteer",
        email: `${id}@seed.example.com`,
        category: "volunteers",
        reportsToId: leadId,
      }),
    )
  }

  for (let idx = 1; idx <= 26; idx += 1) {
    const id = `seed-supporter-${idx}`
    people.push(
      person({
        id,
        name: seededName(800 + idx),
        title: idx % 3 === 0 ? "Foundation Partner" : "Community Supporter",
        email: `${id}@seed.example.com`,
        category: "supporters",
      }),
    )
  }

  return people
}

function buildOrgProfile({
  fullName,
  email,
  variant,
  timezone,
  orgPeople,
}) {
  return {
    name: "Launch Demo Organization",
    tagline: "Building from idea to funded impact.",
    description:
      "A fully seeded evaluator workspace showing roadmap progress, team structure, programs, and launch readiness.",
    mission: "Launch a compliant nonprofit with sustainable operations and clear impact outcomes.",
    need: "Founders need one operating system that turns intent into execution.",
    programs: "Board Readiness Bootcamp; Community Intake Lab; Volunteer Activation.",
    values: "Integrity, stewardship, measurable impact.",
    email,
    phone: "(555) 010-2040",
    address_street: "123 Impact Ave",
    address_city: "Los Angeles",
    address_state: "CA",
    address_postal: "90001",
    address_country: "US",
    publicUrl: "https://coachhousesolutions.org",
    newsletter: "https://blog.coachhousesolutions.org",
    linkedin: "https://linkedin.com/company/coach-house-solutions",
    ein: "87-6543210",
    rep: fullName,
    timezone,
    formationStatus: "approved",
    documents: SEEDED_DOCUMENTS,
    roadmap: {
      sections: ROADMAP_CASE_STUDY_SECTIONS.map((section) => ({
        ...section,
        isPublic: false,
        lastUpdated: new Date().toISOString(),
      })),
    },
    meeting_requests: variant === "with_coaching" ? 1 : 0,
    meeting_requests_last: new Date().toISOString(),
    org_people: orgPeople,
  }
}

function validateSeedFixture() {
  const sectionIds = ROADMAP_CASE_STUDY_SECTIONS.map((section) => section.id)
  const sectionSlugs = ROADMAP_CASE_STUDY_SECTIONS.map((section) => section.slug)
  const duplicateSectionIds = sectionIds.filter((id, index) => sectionIds.indexOf(id) !== index)
  const duplicateSectionSlugs = sectionSlugs.filter((slug, index) => sectionSlugs.indexOf(slug) !== index)
  const documentKeys = Object.keys(SEEDED_DOCUMENTS)
  const requiredContentSections = ROADMAP_CASE_STUDY_SECTIONS.filter((section) =>
    REQUIRED_ROADMAP_SECTION_IDS.has(section.id),
  )
  const statusCounts = ROADMAP_CASE_STUDY_SECTIONS.reduce(
    (acc, section) => {
      acc[section.status] = (acc[section.status] ?? 0) + 1
      return acc
    },
    { not_started: 0, in_progress: 0, complete: 0 },
  )
  const errors = []

  if (duplicateSectionIds.length > 0) {
    errors.push(`Duplicate roadmap section ids: ${duplicateSectionIds.join(", ")}`)
  }
  if (duplicateSectionSlugs.length > 0) {
    errors.push(`Duplicate roadmap section slugs: ${duplicateSectionSlugs.join(", ")}`)
  }

  for (const section of ROADMAP_CASE_STUDY_SECTIONS) {
    if (String(section.id).trim().length === 0) {
      errors.push("Roadmap section has empty id.")
    }
    if (String(section.slug).trim().length === 0) {
      errors.push(`Roadmap section "${section.id}" has empty slug.`)
    }
    if (String(section.title).trim().length === 0) {
      errors.push(`Roadmap section "${section.id}" has empty title.`)
    }
    if (String(section.subtitle).trim().length === 0) {
      errors.push(`Roadmap section "${section.id}" has empty subtitle.`)
    }
    if (!ROADMAP_STATUS_VALUES.has(section.status)) {
      errors.push(`Roadmap section "${section.id}" has invalid status "${section.status}".`)
    }
  }

  for (const id of REQUIRED_ROADMAP_SECTION_IDS) {
    if (!sectionIds.includes(id)) {
      errors.push(`Missing required roadmap section: ${id}`)
    }
  }

  for (const key of REQUIRED_DOCUMENT_KEYS) {
    if (!documentKeys.includes(key)) {
      errors.push(`Missing required seeded document: ${key}`)
    }
  }

  for (const key of documentKeys) {
    const document = SEEDED_DOCUMENTS[key]
    if (!document || typeof document !== "object") {
      errors.push(`Document "${key}" has invalid shape.`)
      continue
    }
    if (!String(document.name ?? "").trim()) {
      errors.push(`Document "${key}" is missing name.`)
    }
    if (!String(document.path ?? "").trim()) {
      errors.push(`Document "${key}" is missing path.`)
    }
    if (!Number.isFinite(document.size) || Number(document.size) <= 0) {
      errors.push(`Document "${key}" has invalid size.`)
    }
    if (!String(document.mime ?? "").startsWith("application/pdf")) {
      errors.push(`Document "${key}" mime must be application/pdf.`)
    }
    const updatedAtMs = Date.parse(String(document.updatedAt ?? ""))
    if (Number.isNaN(updatedAtMs)) {
      errors.push(`Document "${key}" has invalid updatedAt timestamp.`)
    }
  }

  for (const section of requiredContentSections) {
    const contentLength = String(section.content ?? "").trim().length
    if (contentLength < 80) {
      errors.push(`Roadmap section "${section.id}" content is too short (${contentLength} chars).`)
    }
    if (section.status === "not_started") {
      errors.push(`Roadmap section "${section.id}" cannot be not_started in seed fixture.`)
    }
  }

  const fixtureOrgPeople = buildOrgPeople({
    ownerUserId: "owner-preview",
    ownerName: "Launch QA Account",
    ownerEmail: "launch.preview@example.com",
    staffUserId: "staff-preview",
    staffEmail: "launch.staff@example.com",
    boardUserId: "board-preview",
    boardEmail: "launch.board@example.com",
  })
  const fixtureOrgProfile = buildOrgProfile({
    fullName: "Launch QA Account",
    email: "launch.preview@example.com",
    variant: "with_coaching",
    timezone: "America/Los_Angeles",
    orgPeople: fixtureOrgPeople,
  })

  for (const key of REQUIRED_ORG_PROFILE_KEYS) {
    if (!(key in fixtureOrgProfile)) {
      errors.push(`Org profile fixture is missing required key "${key}".`)
    }
  }

  if (!Array.isArray(fixtureOrgProfile.org_people) || fixtureOrgProfile.org_people.length < 1) {
    errors.push("Org profile fixture must include at least one person.")
  }

  if (
    !fixtureOrgProfile.roadmap ||
    typeof fixtureOrgProfile.roadmap !== "object" ||
    !Array.isArray(fixtureOrgProfile.roadmap.sections)
  ) {
    errors.push("Org profile fixture roadmap structure is invalid.")
  }

  return {
    sectionCount: ROADMAP_CASE_STUDY_SECTIONS.length,
    documentCount: documentKeys.length,
    duplicateSectionIds,
    duplicateSectionSlugs,
    statusCounts,
    errors,
  }
}

async function findUserByEmail(adminClient, email) {
  const perPage = 200
  let page = 1

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage })
    if (error) throw new Error(`Unable to list users: ${error.message}`)
    const users = data?.users ?? []
    const match = users.find((user) => (user.email ?? "").toLowerCase() === email.toLowerCase())
    if (match) return match
    if (users.length < perPage) break
    page += 1
  }

  return null
}

async function ensureUser({
  adminClient,
  email,
  password,
  fullName,
  role,
  timezone,
  onboardingCompleted,
}) {
  const onboardingMetadata = onboardingCompleted
    ? {
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      }
    : {
        onboarding_completed: false,
      }
  const existing = await findUserByEmail(adminClient, email)
  if (existing) {
    const shouldRotatePassword = typeof password === "string" && password.trim().length > 0
    const updatePayload = {
      email_confirm: true,
      user_metadata: {
        ...(existing.user_metadata ?? {}),
        full_name: fullName,
        ...onboardingMetadata,
        marketing_opt_in: true,
        newsletter_opt_in: true,
      },
    }
    if (shouldRotatePassword) {
      updatePayload.password = password
    }

    const { error: updateError } = await adminClient.auth.admin.updateUserById(existing.id, {
      ...updatePayload,
    })
    if (updateError) throw new Error(`Unable to update existing user: ${updateError.message}`)
    const { error: profileUpsertError } = await adminClient
      .from("profiles")
      .upsert(
        {
          id: existing.id,
          email,
          full_name: fullName,
          role,
          headline: "Founder and Executive Director",
          timezone,
        },
        { onConflict: "id" },
      )
    if (profileUpsertError) throw new Error(`Unable to upsert existing profile: ${profileUpsertError.message}`)
    return { user: existing, created: false, passwordUsed: shouldRotatePassword ? password : null }
  }

  const resolvedPassword = typeof password === "string" && password.trim().length > 0 ? password : generateStrongTempPassword()
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password: resolvedPassword,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      ...onboardingMetadata,
      marketing_opt_in: true,
      newsletter_opt_in: true,
    },
  })
  if (error || !data?.user) {
    throw new Error(`Unable to create user: ${error?.message ?? "unknown error"}`)
  }

  const { error: profileError } = await adminClient
    .from("profiles")
    .upsert(
      {
        id: data.user.id,
        email,
        full_name: fullName,
        role,
        headline: "Founder and Executive Director",
        timezone,
      },
      { onConflict: "id" },
    )
  if (profileError) throw new Error(`Unable to seed profile: ${profileError.message}`)

  return { user: data.user, created: true, passwordUsed: resolvedPassword }
}

async function ensureMemberUser({ adminClient, email, fullName, timezone }) {
  const existing = await findUserByEmail(adminClient, email)
  if (existing) {
    await adminClient
      .from("profiles")
      .upsert(
        {
          id: existing.id,
          email,
          full_name: fullName,
          role: "member",
          timezone,
        },
        { onConflict: "id" },
      )
    return existing
  }

  const password = `TempPass!${rand(10)}`
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
    },
  })
  if (error || !data?.user) {
    throw new Error(`Unable to create member user ${email}: ${error?.message ?? "unknown error"}`)
  }
  await adminClient
    .from("profiles")
    .upsert(
      {
        id: data.user.id,
        email,
        full_name: fullName,
        role: "member",
        timezone,
      },
      { onConflict: "id" },
    )
  return data.user
}

async function main() {
  const args = parseArgs(process.argv)
  const dryRun = hasTruthyFlag(args["dry-run"] ?? args.dryRun)
  const variantRaw = String(args.variant ?? "with_coaching")
  const variant =
    variantRaw === "without_coaching" || variantRaw === "none" ? variantRaw : "with_coaching"
  const progressMode = String(args.progress ?? "complete") === "mixed" ? "mixed" : "complete"
  const onboardingCompleted = String(args.onboarding ?? "complete") !== "incomplete"
  const defaultEmail = `launch.full+${Date.now()}@example.com`
  const email = String(args.email ?? defaultEmail).trim().toLowerCase()
  const passwordArg =
    typeof args.password === "string" && String(args.password).trim().length > 0
      ? String(args.password).trim()
      : null
  const fullName = String(args.name ?? "Launch QA Account")
  const role = String(args.role ?? "member") === "admin" ? "admin" : "member"
  const timezone = String(args.timezone ?? "America/Los_Angeles").trim() || "America/Los_Angeles"

  const dotenvLocal = parseEnvFile(path.resolve(process.cwd(), ".env.local"))
  const dotenv = parseEnvFile(path.resolve(process.cwd(), ".env"))
  const envSources = [process.env, dotenvLocal, dotenv]

  const supabaseUrl =
    resolveEnv("SUPABASE_URL", envSources) || resolveEnv("NEXT_PUBLIC_SUPABASE_URL", envSources)
  const serviceRole = resolveEnv("SUPABASE_SERVICE_ROLE_KEY", envSources)

  if (dryRun) {
    const fixtureValidation = validateSeedFixture()
    const previewOrgPeople = buildOrgPeople({
      ownerUserId: "owner-preview",
      ownerName: "Launch QA Account",
      ownerEmail: "launch.preview@example.com",
      staffUserId: "staff-preview",
      staffEmail: "launch.staff@example.com",
      boardUserId: "board-preview",
      boardEmail: "launch.board@example.com",
    })

    console.log("Dry run: full-account seed fixture validation")
    console.log(`email_preview: ${email}`)
    console.log(`role: ${role}`)
    console.log(`variant: ${variant}`)
    console.log(`progress_mode: ${progressMode}`)
    console.log(`onboarding: ${onboardingCompleted ? "complete" : "incomplete"}`)
    console.log(`roadmap_sections: ${fixtureValidation.sectionCount}`)
    console.log(
      `roadmap_status_counts: complete=${fixtureValidation.statusCounts.complete},in_progress=${fixtureValidation.statusCounts.in_progress},not_started=${fixtureValidation.statusCounts.not_started}`,
    )
    console.log(`documents_seeded: ${fixtureValidation.documentCount}`)
    console.log(`org_people_seeded: ${previewOrgPeople.length}`)
    console.log(`duplicate_section_ids: ${fixtureValidation.duplicateSectionIds.length}`)
    console.log(`duplicate_section_slugs: ${fixtureValidation.duplicateSectionSlugs.length}`)
    if (fixtureValidation.errors.length > 0) {
      console.error("Seed fixture validation failed.")
      fixtureValidation.errors.forEach((error) => console.error(`- ${error}`))
      process.exit(1)
    }
    console.log("Seed fixture validation passed.")
    return
  }

  if (!supabaseUrl || !serviceRole) {
    console.error("Missing Supabase credentials.")
    console.error("Required: SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL).")
    console.error("Set them in shell env or .env.local, then re-run.")
    process.exit(1)
  }

  const adminClient = createClient(supabaseUrl, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { user, created, passwordUsed } = await ensureUser({
    adminClient,
    email,
    password: passwordArg,
    fullName,
    role,
    timezone,
    onboardingCompleted,
  })

  const userId = user.id
  const baseSlugSource = args.slug ?? fullName ?? email.split("@")[0] ?? "launch-workspace"
  const baseSlug = slugify(String(baseSlugSource))
  const publicSlug = `${baseSlug}-${userId.slice(0, 6)}`

  const emailLocal = email.split("@")[0] || "launch.user"
  const staffEmail = `${emailLocal}.staff@example.com`
  const boardEmail = `${emailLocal}.board@example.com`

  const [staffUser, boardUser] = await Promise.all([
    ensureMemberUser({
      adminClient,
      email: staffEmail,
      fullName: "Jordan Staff",
      timezone,
    }),
    ensureMemberUser({
      adminClient,
      email: boardEmail,
      fullName: "Casey Board",
      timezone,
    }),
  ])

  const orgPeople = buildOrgPeople({
    ownerUserId: userId,
    ownerName: fullName,
    ownerEmail: email,
    staffUserId: staffUser.id,
    staffEmail,
    boardUserId: boardUser.id,
    boardEmail,
  })

  const orgProfile = buildOrgProfile({
    fullName,
    email,
    variant,
    timezone,
    orgPeople,
  })

  const { error: orgError } = await adminClient.from("organizations").upsert(
    {
      user_id: userId,
      status: "approved",
      public_slug: publicSlug,
      is_public: false,
      is_public_roadmap: false,
      profile: orgProfile,
    },
    { onConflict: "user_id" },
  )
  if (orgError) throw new Error(`Unable to seed organization: ${orgError.message}`)

  await adminClient
    .from("organization_memberships")
    .upsert(
      [
        {
          org_id: userId,
          member_id: userId,
          member_email: email,
          role: "owner",
        },
        {
          org_id: userId,
          member_id: staffUser.id,
          member_email: staffEmail,
          role: "staff",
        },
        {
          org_id: userId,
          member_id: boardUser.id,
          member_email: boardEmail,
          role: "board",
        },
      ],
      { onConflict: "org_id,member_id" },
    )

  const { data: existingOnboarding } = await adminClient
    .from("onboarding_responses")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const onboardingPayload = {
    user_id: userId,
    org_id: userId,
    confidence_operating: 8,
    confidence_funding: 7,
    confidence_funders: 6,
    notes: "Seeded response for launch QA.",
    follow_up: true,
  }
  if (existingOnboarding?.id) {
    const { error: onboardingUpdateError } = await adminClient
      .from("onboarding_responses")
      .update(onboardingPayload)
      .eq("id", existingOnboarding.id)
    if (onboardingUpdateError) throw new Error(`Unable to update onboarding response: ${onboardingUpdateError.message}`)
  } else {
    const { error: onboardingInsertError } = await adminClient
      .from("onboarding_responses")
      .insert(onboardingPayload)
    if (onboardingInsertError) throw new Error(`Unable to insert onboarding response: ${onboardingInsertError.message}`)
  }

  const { error: accessSettingsError } = await adminClient
    .from("organization_access_settings")
    .upsert(
      {
        org_id: userId,
        admins_can_invite: true,
        staff_can_manage_calendar: true,
      },
      { onConflict: "org_id" },
    )
  if (accessSettingsError && accessSettingsError.code !== "42P01") {
    throw new Error(`Unable to seed organization access settings: ${accessSettingsError.message}`)
  }

  await adminClient
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        stripe_customer_id: `cus_seed_${userId.slice(0, 10)}`,
        stripe_subscription_id: `sub_seed_org_${userId.slice(0, 18)}`,
        status: "active",
        metadata: { planName: "Organization" },
      },
      { onConflict: "stripe_subscription_id" },
    )

  if (variant !== "none") {
    const coachingIncluded = variant === "with_coaching"
    const purchasePayload = {
      user_id: userId,
      stripe_checkout_session_id: `cs_seed_acc_${variant}_${userId.slice(0, 16)}`,
      stripe_payment_intent_id: `pi_seed_acc_${variant}_${userId.slice(0, 16)}`,
      stripe_customer_id: `cus_seed_${userId.slice(0, 10)}`,
      coaching_included: coachingIncluded,
      status: "active",
    }
    const { error: accelError } = await adminClient
      .from("accelerator_purchases")
      .upsert(purchasePayload, { onConflict: "stripe_checkout_session_id" })

    if (accelError && accelError.code === "42703") {
      // Backward compatibility before coaching_included column exists.
      const legacyPayload = { ...purchasePayload }
      delete legacyPayload.coaching_included
      const { error: legacyError } = await adminClient
        .from("accelerator_purchases")
        .upsert(legacyPayload, { onConflict: "stripe_checkout_session_id" })
      if (legacyError) throw new Error(`Unable to seed accelerator purchase (legacy): ${legacyError.message}`)
    } else if (accelError) {
      throw new Error(`Unable to seed accelerator purchase: ${accelError.message}`)
    }
  }

  const programRows = [
    {
      user_id: userId,
      title: "Demo Program - Board Readiness Bootcamp",
      subtitle: "Governance fundamentals for board + staff alignment.",
      description: "Build board operating cadence and decision infrastructure.",
      location: "Hybrid",
      location_type: "in_person",
      location_url: null,
      team_ids: [userId, staffUser.id],
      duration_label: "8 weeks",
      start_date: monthStartIso(0),
      end_date: null,
      features: ["Training", "Governance", "Templates"],
      status_label: "In progress",
      goal_cents: 1800000,
      raised_cents: 900000,
      is_public: false,
      cta_label: "View details",
      cta_url: null,
      wizard_snapshot: {
        title: "Board Readiness Bootcamp",
        oneSentence: "Governance fundamentals for board + staff alignment.",
        staffCount: 2,
        pilotPeopleServed: 24,
      },
    },
    {
      user_id: userId,
      title: "Demo Program - Community Intake Lab",
      subtitle: "Pilot intake and referral workflows.",
      description: "Run an intake cycle with community validation and reporting.",
      location: "South Hub",
      location_type: "in_person",
      location_url: null,
      team_ids: [userId, staffUser.id],
      duration_label: "12 weeks",
      start_date: monthStartIso(1),
      end_date: null,
      features: ["Direct services", "Referral network"],
      status_label: "Planned",
      goal_cents: 2600000,
      raised_cents: 0,
      is_public: false,
      cta_label: "View details",
      cta_url: null,
      wizard_snapshot: {
        title: "Community Intake Lab",
        oneSentence: "Pilot intake and referral workflows.",
        staffCount: 3,
        pilotPeopleServed: 40,
      },
    },
  ]

  const { data: existingPrograms } = await adminClient
    .from("programs")
    .select("title")
    .eq("user_id", userId)
    .like("title", "Demo Program - %")
  const existingProgramTitles = new Set((existingPrograms ?? []).map((row) => row.title))
  for (const row of programRows) {
    if (existingProgramTitles.has(row.title)) continue
    let { error: insertProgramError } = await adminClient.from("programs").insert(row)
    if (insertProgramError && /wizard_snapshot/i.test(insertProgramError.message)) {
      const fallback = { ...row }
      delete fallback.wizard_snapshot
      const retry = await adminClient.from("programs").insert(fallback)
      insertProgramError = retry.error
    }
    if (insertProgramError) throw new Error(`Unable to seed program "${row.title}": ${insertProgramError.message}`)
  }

  const notificationRows = [
    {
      user_id: userId,
      org_id: userId,
      actor_id: userId,
      type: "launch_seed",
      title: "Launch checklist prepared",
      description: "Your workspace has been seeded with launch-ready demo data.",
      href: "/my-organization",
      tone: "success",
    },
    {
      user_id: userId,
      org_id: userId,
      actor_id: userId,
      type: "launch_seed",
      title: "Roadmap section updated",
      description: "Strategic Foundations is now marked in progress.",
      href: "/roadmap",
      tone: "info",
    },
    {
      user_id: userId,
      org_id: userId,
      actor_id: userId,
      type: "launch_seed",
      title: "Board packet review due",
      description: "Finalize board docs before Friday meeting.",
      href: "/my-organization/documents",
      tone: "warning",
    },
  ]

  const { data: existingNotifications } = await adminClient
    .from("notifications")
    .select("title")
    .eq("user_id", userId)
    .in(
      "title",
      notificationRows.map((row) => row.title),
    )
  const existingNotificationTitles = new Set((existingNotifications ?? []).map((row) => row.title))
  const missingNotifications = notificationRows.filter((row) => !existingNotificationTitles.has(row.title))
  if (missingNotifications.length > 0) {
    const { error: notificationError } = await adminClient.from("notifications").insert(missingNotifications)
    if (notificationError) throw new Error(`Unable to seed notifications: ${notificationError.message}`)
  }

  const now = new Date()
  const boardMeetingStart = addDays(now, 2)
  boardMeetingStart.setHours(17, 0, 0, 0)
  const boardMeetingEnd = new Date(boardMeetingStart)
  boardMeetingEnd.setHours(boardMeetingStart.getHours() + 1)
  const grantDraftStart = addDays(now, 5)
  grantDraftStart.setHours(14, 30, 0, 0)
  const grantDraftEnd = new Date(grantDraftStart)
  grantDraftEnd.setHours(grantDraftStart.getHours() + 1)
  const calendarRows = [
    {
      org_id: userId,
      title: "Board meeting",
      description: "Review launch checklist and roadmap updates.",
      starts_at: boardMeetingStart.toISOString(),
      ends_at: boardMeetingEnd.toISOString(),
      all_day: false,
      status: "active",
      assigned_roles: ["owner", "admin", "staff", "board"],
    },
    {
      org_id: userId,
      title: "Grant narrative draft due",
      description: "First complete draft due for review.",
      starts_at: grantDraftStart.toISOString(),
      ends_at: grantDraftEnd.toISOString(),
      all_day: false,
      status: "active",
      assigned_roles: ["owner", "admin", "staff"],
    },
  ]

  const { data: existingEvents } = await adminClient
    .from("roadmap_calendar_internal_events")
    .select("title")
    .eq("org_id", userId)
    .in(
      "title",
      calendarRows.map((row) => row.title),
    )
  const existingEventTitles = new Set((existingEvents ?? []).map((row) => row.title))
  const missingEvents = calendarRows.filter((row) => !existingEventTitles.has(row.title))
  if (missingEvents.length > 0) {
    const { error: eventError } = await adminClient.from("roadmap_calendar_internal_events").insert(missingEvents)
    if (eventError) throw new Error(`Unable to seed calendar events: ${eventError.message}`)
  }

  const { data: classes, error: classesError } = await adminClient
    .from("classes")
    .select("id, slug, is_published")
    .eq("is_published", true)
  if (classesError) throw new Error(`Unable to load classes: ${classesError.message}`)

  const classIds = (classes ?? []).map((row) => row.id)
  if (classIds.length > 0) {
    const { data: existingEnrollments, error: enrollmentReadError } = await adminClient
      .from("enrollments")
      .select("class_id")
      .eq("user_id", userId)
      .in("class_id", classIds)
    if (enrollmentReadError) throw new Error(`Unable to load enrollments: ${enrollmentReadError.message}`)

    const existingEnrollmentClassIds = new Set((existingEnrollments ?? []).map((row) => row.class_id))
    const missingEnrollmentRows = classIds
      .filter((classId) => !existingEnrollmentClassIds.has(classId))
      .map((classId) => ({
        user_id: userId,
        class_id: classId,
        status: "active",
      }))
    if (missingEnrollmentRows.length > 0) {
      const { error: enrollmentInsertError } = await adminClient.from("enrollments").insert(missingEnrollmentRows)
      if (enrollmentInsertError) throw new Error(`Unable to seed enrollments: ${enrollmentInsertError.message}`)
    }

    const { data: modules, error: modulesError } = await adminClient
      .from("modules")
      .select("id, class_id, idx, title, is_published")
      .eq("is_published", true)
      .in("class_id", classIds)
      .order("class_id", { ascending: true })
      .order("idx", { ascending: true })
    if (modulesError) throw new Error(`Unable to load modules: ${modulesError.message}`)

    const moduleIds = (modules ?? []).map((row) => row.id)
    if (moduleIds.length > 0) {
      const progressRows = (modules ?? [])
        .map((module, index) => {
          const status =
            progressMode === "complete"
              ? "completed"
              : index < 6
                ? "completed"
                : index < 10
                  ? "in_progress"
                  : "not_started"
          if (status === "not_started" && progressMode !== "complete") return null
          const notePrefix = status === "completed" ? "Completed note" : "In-progress note"
          return {
            user_id: userId,
            module_id: module.id,
            status,
            completed_at: status === "completed" ? addDays(new Date(), -(12 - Math.min(index, 12))).toISOString() : null,
            notes: {
              content: `${notePrefix}: ${module.title}`,
              format: "markdown",
            },
          }
        })
        .filter(Boolean)

      if (progressRows.length > 0) {
        const { error: progressInsertError } = await adminClient
          .from("module_progress")
          .upsert(progressRows, { onConflict: "user_id,module_id" })
        if (progressInsertError) throw new Error(`Unable to seed module progress: ${progressInsertError.message}`)
      }

      const submissionRows = (modules ?? [])
        .map((module, index) => {
          const status =
            progressMode === "complete"
              ? "accepted"
              : index < 6
                ? "accepted"
                : index < 10
                  ? "submitted"
                  : null
          if (!status) return null
          return {
            module_id: module.id,
            user_id: userId,
            status,
            answers: {
              summary: `Case study response for ${module.title}`,
              updatedAt: new Date().toISOString(),
            },
          }
        })
        .filter(Boolean)

      if (submissionRows.length > 0) {
        const { error: submissionsError } = await adminClient
          .from("assignment_submissions")
          .upsert(submissionRows, { onConflict: "module_id,user_id" })
        if (submissionsError) throw new Error(`Unable to seed assignment submissions: ${submissionsError.message}`)
      }
    }
  }

  console.log("Seed complete.")
  console.log(`email: ${email}`)
  console.log(`password: ${passwordUsed ?? "(unchanged for existing user)"}`)
  console.log(`user_id: ${userId}`)
  console.log(`created_user: ${created ? "yes" : "no"}`)
  console.log(`public_slug: ${publicSlug}`)
  console.log(`accelerator_variant: ${variant}`)
  console.log(`progress_mode: ${progressMode}`)
  console.log(`onboarding: ${onboardingCompleted ? "complete" : "incomplete"}`)
  console.log(`timezone: ${timezone}`)
}

main().catch((error) => {
  console.error("Seed failed:", error instanceof Error ? error.message : error)
  process.exit(1)
})
