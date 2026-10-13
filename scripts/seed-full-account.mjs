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
//   node scripts/seed-full-account.mjs --email superadmin@example.com --role admin --slug testing123 --case-study fiscal-sponsorship
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
  return Math.random()
    .toString(36)
    .slice(2, 2 + n)
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
  taxExemptCertificate: {
    name: "State Tax Exempt Certificate.pdf",
    path: "seed/tax-exempt-certificate.pdf",
    size: 142_441,
    mime: "application/pdf",
    updatedAt: "2026-01-23T14:10:00.000Z",
  },
  ueiConfirmation: {
    name: "UEI Confirmation.pdf",
    path: "seed/uei-confirmation.pdf",
    size: 118_882,
    mime: "application/pdf",
    updatedAt: "2026-01-24T15:22:00.000Z",
  },
  samActiveStatus: {
    name: "SAM Active Status.pdf",
    path: "seed/sam-active-status.pdf",
    size: 163_210,
    mime: "application/pdf",
    updatedAt: "2026-01-25T12:08:00.000Z",
  },
  grantsGovRegistration: {
    name: "Grants.gov Registration Confirmation.pdf",
    path: "seed/grants-gov-registration.pdf",
    size: 154_902,
    mime: "application/pdf",
    updatedAt: "2026-01-26T09:32:00.000Z",
  },
  gataPreQualification: {
    name: "GATA Pre-Qualification.pdf",
    path: "seed/gata-pre-qualification.pdf",
    size: 189_004,
    mime: "application/pdf",
    updatedAt: "2026-01-27T17:02:00.000Z",
  },
  einConfirmationLetter: {
    name: "EIN Confirmation Letter CP 575.pdf",
    path: "seed/ein-confirmation-letter.pdf",
    size: 109_441,
    mime: "application/pdf",
    updatedAt: "2026-01-28T10:45:00.000Z",
  },
  irs990s: {
    name: "IRS Form 990s 2023-2025.pdf",
    path: "seed/irs-990s.pdf",
    size: 512_912,
    mime: "application/pdf",
    updatedAt: "2026-01-29T18:22:00.000Z",
  },
  auditedFinancials: {
    name: "Audited Financials.pdf",
    path: "seed/audited-financials.pdf",
    size: 641_005,
    mime: "application/pdf",
    updatedAt: "2026-01-30T16:16:00.000Z",
  },
}

const FISCAL_CASE_STUDY_KEY = "fiscal-sponsorship"
const FISCAL_CASE_STUDY_ORG_NAME = "testing123 Southside Community Table"
const FISCAL_CASE_STUDY_PROJECT_NAME = "Southside Community Table"
const FISCAL_CASE_STUDY_PROJECT_START = "2026-07-01"
const FISCAL_CASE_STUDY_PROJECT_END = "2027-06-30"
const FISCAL_CASE_STUDY_BUDGET_ROWS = [
  { category: "Community meals and grocery supplies", amountCents: 1850000 },
  { category: "Part-time neighborhood coordinators", amountCents: 2400000 },
  { category: "Family resource night childcare", amountCents: 720000 },
  { category: "Translation, outreach, and printing", amountCents: 430000 },
  {
    category: "Insurance, permits, and fiscal administration",
    amountCents: 450000,
  },
]
const FISCAL_CASE_STUDY_REQUIRED_DOCUMENTS = [
  {
    key: "tax_id_confirmation",
    label: "Tax ID confirmation",
    fileName: "Southside Community Table EIN Confirmation.pdf",
    description:
      "EIN confirmation and tax identity support for the sponsored project.",
    sizeBytes: 118_204,
  },
  {
    key: "governing_documents",
    label: "Governing documents",
    fileName: "Southside Community Table Steering Committee Charter.pdf",
    description:
      "Current steering committee charter and local control structure.",
    sizeBytes: 212_982,
  },
  {
    key: "formation_or_good_standing",
    label: "Formation or good standing",
    fileName: "Southside Community Table Formation Status Memo.pdf",
    description:
      "Formation-status memo explaining the in-progress 501(c)(3) pathway.",
    sizeBytes: 149_220,
  },
  {
    key: "budget_support",
    label: "Budget support",
    fileName: "Southside Community Table Budget CSV.pdf",
    description:
      "Line-item budget export and vendor assumptions for the pilot year.",
    sizeBytes: 98_114,
  },
  {
    key: "fundraising_materials",
    label: "Fundraising materials",
    fileName: "Southside Community Table Donor Language.pdf",
    description:
      "Draft donor-facing copy with Coach House disclosure language.",
    sizeBytes: 174_881,
  },
  {
    key: "insurance",
    label: "Insurance",
    fileName: "Southside Community Table Insurance COI.pdf",
    description:
      "Certificate of insurance for community meal and resource events.",
    sizeBytes: 132_550,
  },
  {
    key: "grant_request_support",
    label: "Grant request support",
    fileName: "Southside Community Table Vendor Estimates.pdf",
    description:
      "Vendor estimates and draft grant-request support for post-signing funds.",
    sizeBytes: 228_019,
  },
  {
    key: "additional_info",
    label: "Additional information",
    fileName: "Southside Community Table Case Study Notes.pdf",
    description:
      "Additional case-study assumptions and review notes for internal QA.",
    sizeBytes: 91_484,
  },
]

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
    status: "complete",
    content:
      "If we pair consistent community meals with family resource navigation and a trusted local leadership team, then neighbors will access services earlier, reduce food insecurity, and build stronger mutual-aid routines. Inputs include trained volunteers, donated food partners, part-time coordinators, a steering committee, and weekly resource-night operations. We measure meals served, household resource referrals, return participation, volunteer retention, and caregiver-reported stress reduction.",
  },
  {
    id: "program",
    title: "Program",
    subtitle: "Program design, delivery cadence, and participation targets.",
    slug: "program",
    status: "complete",
    content:
      "Southside Community Table runs weekly neighborhood meal nights, monthly family resource clinics, and seasonal youth stewardship shifts. Each event combines a hot meal, pantry staples, benefits navigation, and follow-up notes for households requesting help. The first-year target is 2,400 meals, 180 household referrals, 45 recurring volunteers, and four neighborhood-hosted resource nights per month.",
  },
  {
    id: "evaluation",
    title: "Evaluation",
    subtitle: "Measurement stack and review cadence.",
    slug: "evaluation",
    status: "complete",
    content:
      "The evaluation stack combines event attendance, meal counts, referral logs, volunteer hours, follow-up completion, and short caregiver check-ins. Program leads review weekly operating data every Friday and summarize outcomes monthly for the steering committee. Coach House review can use this same data to confirm charitable activity, donor reporting, and readiness for grant disbursement requests.",
  },
  {
    id: "people",
    title: "People",
    subtitle: "Current team and near-term hiring plan.",
    slug: "people",
    status: "complete",
    content:
      "Caleb Hamernick is the applicant and executive lead for the case-study workspace. Jordan Staff owns operations, volunteer scheduling, vendor coordination, and weekly resource-night logistics. Casey Board chairs the steering committee and reviews budget, risk, and community accountability. The first-year staffing plan adds two part-time neighborhood coordinators and a volunteer captain pool before the fourth resource-night site opens.",
  },
  {
    id: "budget",
    title: "Budget",
    subtitle: "Current budget and phase-one investment priorities.",
    slug: "budget",
    status: "complete",
    content:
      "The first-year pilot budget is $64,500. Planned expenses include food and grocery supplies, part-time neighborhood coordinators, childcare support during resource nights, translation and outreach, permits, insurance, and fiscal administration. The budget is intentionally modest, line-item based, and designed to be prefilled into the fiscal sponsorship application, agreement packet, and future grant request workflow without manual re-entry.",
  },
  {
    id: "fundraising",
    title: "Fundraising",
    subtitle: "Funding channels and target outcomes.",
    slug: "fundraising",
    status: "complete",
    content:
      "The first-year fundraising goal is $64,500 through local family foundations, individual donors, church partners, and a small corporate sponsorship package. All public fundraising copy will use Coach House disclosure language after written review. Initial outreach focuses on two foundation requests, a neighborhood giving page, and a partner-hosted dinner campaign that can be approved before publication.",
  },
  {
    id: "fundraising_strategy",
    title: "Strategy",
    subtitle: "Priority sources, ask sizes, and outreach sequence.",
    slug: "fundraising-strategy",
    status: "complete",
    content:
      "The first funding sequence is three tracks: a $25,000 family foundation request for year-one coordination, a $15,000 church and civic partner pool for weekly food purchases, and a $10,000 neighborhood donor campaign tied to meal-night milestones. Outreach starts with warm introductions from the steering committee, then moves into small hosted dinners and follow-up one-pagers generated from the saved roadmap and fiscal sponsorship data.",
  },
  {
    id: "fundraising_presentation",
    title: "Presentation",
    subtitle: "Funder narrative and materials ready for review.",
    slug: "fundraising-presentation",
    status: "complete",
    content:
      "The pitch narrative centers on a simple promise: families should be able to get a meal, resource navigation, and trusted follow-up in one neighborhood rhythm. The presentation package includes the project overview, first-year budget, fiscal sponsorship disclosure language, required document checklist, and donor-facing outcomes. Before any public use, Coach House reviews the fundraising copy and confirms the fiscal sponsorship relationship is represented accurately.",
  },
  {
    id: "fundraising_crm_plan",
    title: "Treasure Map / CRM Plan",
    subtitle: "Prospect tracking and stewardship cadence.",
    slug: "treasure-map-crm-plan",
    status: "complete",
    content:
      "Prospects are tracked by source, relationship owner, next action, expected ask range, and restricted-fund designation. Jordan owns weekly CRM cleanup, Casey owns steering-committee introductions, and Caleb owns funder follow-up notes. Every committed gift receives a thank-you, a restricted-fund receipt path through Coach House, and a quarterly impact update tied to meals served, referrals completed, and volunteer retention.",
  },
  {
    id: "communications",
    title: "Communications",
    subtitle: "Audience, channels, and approved disclosure language.",
    slug: "communications",
    status: "complete",
    content:
      "Primary communications go to neighborhood families, volunteer teams, referral partners, local donors, and Coach House reviewers. Channels include printed flyers, partner newsletters, SMS reminders, and a small donor update list. Public copy uses plain language, avoids overpromising services, and includes the required fiscal sponsorship disclosure once the agreement is executed.",
  },
  {
    id: "board_strategy",
    title: "Board Strategy",
    subtitle: "Steering committee structure and governance priorities.",
    slug: "board-strategy",
    status: "complete",
    content:
      "The interim steering committee focuses on community accountability, budget review, volunteer safety, and partner coordination while the organization completes its own formation path. Casey chairs monthly review meetings, maintains conflict-of-interest notes, and prepares governance updates for Coach House. The near-term goal is a five-person advisory group with lived-experience, finance, food-access, youth development, and neighborhood-partner representation.",
  },
  {
    id: "board_calendar",
    title: "Calendar",
    subtitle: "Meeting cadence and governance milestones.",
    slug: "board-calendar",
    status: "complete",
    content:
      "The steering committee meets monthly, with a standing budget and risk review every quarter. Key milestones include fiscal sponsorship application submission, agreement review, first restricted-fund setup, insurance renewal, first grant-request support packet, and a 90-day outcomes review. Meeting notes and action owners are saved to the project workspace so Coach House can verify the review trail.",
  },
  {
    id: "board_handbook",
    title: "Handbook",
    subtitle: "Roles, policies, and onboarding materials.",
    slug: "board-handbook",
    status: "complete",
    content:
      "The steering handbook covers member roles, meeting cadence, conflict disclosure, volunteer safety expectations, document retention, fundraising approval steps, and escalation paths. New committee members receive the project overview, budget, fiscal sponsorship handbook link, required-document checklist, and a short orientation on what Coach House approves versus what the project team manages directly.",
  },
  {
    id: "next_actions",
    title: "Next Actions",
    subtitle: "30-90 day operating priorities and owners.",
    slug: "next-actions",
    status: "complete",
    content:
      "1) Submit the fiscal sponsorship application and supporting documents. 2) Complete Coach House review and generate the prefilled Model C agreement from saved data. 3) Send the DocuSeal packet for applicant signature and Coach House countersignature. 4) Open the first restricted fund record and approve the first grant-request support packet after execution.",
  },
]
const ROADMAP_STATUS_VALUES = new Set([
  "not_started",
  "in_progress",
  "complete",
])
const REQUIRED_ROADMAP_SECTION_IDS = new Set([
  "origin_story",
  "need",
  "mission_vision_values",
  "theory_of_change",
  "program",
  "evaluation",
  "people",
  "budget",
  "fundraising",
  "fundraising_strategy",
  "fundraising_presentation",
  "fundraising_crm_plan",
  "communications",
  "board_strategy",
  "board_calendar",
  "board_handbook",
  "next_actions",
])
const REQUIRED_DOCUMENT_KEYS = new Set(Object.keys(SEEDED_DOCUMENTS))
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
      })
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
      })
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
      })
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
      })
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
      })
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
      })
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
      })
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
      })
    )
  }

  return people
}

function isFiscalSponsorshipCaseStudy(value) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-")
  return (
    normalized === FISCAL_CASE_STUDY_KEY ||
    normalized === "fiscal" ||
    normalized === "fs"
  )
}

function buildBudgetExpenseSummary() {
  return FISCAL_CASE_STUDY_BUDGET_ROWS.map((row) => {
    const dollars = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(row.amountCents / 100)
    return `${row.category},${dollars}`
  }).join("\n")
}

function getFiscalCaseStudyBudgetTotalCents() {
  return FISCAL_CASE_STUDY_BUDGET_ROWS.reduce(
    (total, row) => total + row.amountCents,
    0
  )
}

function buildOrgProfile({
  fullName,
  email,
  variant,
  timezone,
  orgPeople,
  caseStudy,
  orgName,
  projectName,
}) {
  const fiscalCaseStudy = isFiscalSponsorshipCaseStudy(caseStudy)
  const resolvedOrgName = fiscalCaseStudy
    ? orgName || FISCAL_CASE_STUDY_ORG_NAME
    : "Launch Demo Organization"
  const resolvedProjectName = projectName || FISCAL_CASE_STUDY_PROJECT_NAME

  return {
    name: resolvedOrgName,
    tagline: fiscalCaseStudy
      ? "Neighborhood meals, resource nights, and family support under fiscal sponsorship."
      : "Building from idea to funded impact.",
    description: fiscalCaseStudy
      ? "A fully filled case-study workspace for testing fiscal sponsorship intake, document prefill, review, agreement generation, DocuSeal signing, and post-signing fund setup."
      : "A fully seeded evaluator workspace showing roadmap progress, team structure, programs, and launch readiness.",
    mission: fiscalCaseStudy
      ? "Help Southside families access food, resource navigation, and trusted neighborhood support."
      : "Launch a compliant nonprofit with sustainable operations and clear impact outcomes.",
    need: fiscalCaseStudy
      ? "Families in the Southside service area are navigating food insecurity, fragmented referrals, and limited evening access to benefits support."
      : "Founders need one operating system that turns intent into execution.",
    programs: fiscalCaseStudy
      ? `${resolvedProjectName}; Neighborhood Food and Family Resource Nights; Youth Stewardship Fellows.`
      : "Board Readiness Bootcamp; Community Intake Lab; Volunteer Activation.",
    values: fiscalCaseStudy
      ? "Dignity, mutual aid, stewardship, transparency, and neighbor-led accountability."
      : "Integrity, stewardship, measurable impact.",
    email,
    phone: fiscalCaseStudy ? "(312) 555-0148" : "(555) 010-2040",
    address_street: fiscalCaseStudy ? "1840 S Community Way" : "123 Impact Ave",
    address_city: fiscalCaseStudy ? "Chicago" : "Los Angeles",
    address_state: fiscalCaseStudy ? "IL" : "CA",
    address_postal: fiscalCaseStudy ? "60608" : "90001",
    address_country: "US",
    publicUrl: fiscalCaseStudy
      ? "https://example.com/southside-community-table"
      : "https://coachhousesolutions.org",
    newsletter: fiscalCaseStudy
      ? "https://example.com/southside-community-table/updates"
      : "https://blog.coachhousesolutions.org",
    linkedin: fiscalCaseStudy
      ? "https://linkedin.com/company/southside-community-table"
      : "https://linkedin.com/company/coach-house-solutions",
    ein: fiscalCaseStudy ? "36-5550148" : "87-6543210",
    rep: fullName,
    timezone,
    formationStatus: fiscalCaseStudy ? "in_progress" : "approved",
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
  const sectionSlugs = ROADMAP_CASE_STUDY_SECTIONS.map(
    (section) => section.slug
  )
  const duplicateSectionIds = sectionIds.filter(
    (id, index) => sectionIds.indexOf(id) !== index
  )
  const duplicateSectionSlugs = sectionSlugs.filter(
    (slug, index) => sectionSlugs.indexOf(slug) !== index
  )
  const documentKeys = Object.keys(SEEDED_DOCUMENTS)
  const requiredContentSections = ROADMAP_CASE_STUDY_SECTIONS.filter(
    (section) => REQUIRED_ROADMAP_SECTION_IDS.has(section.id)
  )
  const statusCounts = ROADMAP_CASE_STUDY_SECTIONS.reduce(
    (acc, section) => {
      acc[section.status] = (acc[section.status] ?? 0) + 1
      return acc
    },
    { not_started: 0, in_progress: 0, complete: 0 }
  )
  const errors = []

  if (duplicateSectionIds.length > 0) {
    errors.push(
      `Duplicate roadmap section ids: ${duplicateSectionIds.join(", ")}`
    )
  }
  if (duplicateSectionSlugs.length > 0) {
    errors.push(
      `Duplicate roadmap section slugs: ${duplicateSectionSlugs.join(", ")}`
    )
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
      errors.push(
        `Roadmap section "${section.id}" has invalid status "${section.status}".`
      )
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
      errors.push(
        `Roadmap section "${section.id}" content is too short (${contentLength} chars).`
      )
    }
    if (section.status === "not_started") {
      errors.push(
        `Roadmap section "${section.id}" cannot be not_started in seed fixture.`
      )
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

  if (
    !Array.isArray(fixtureOrgProfile.org_people) ||
    fixtureOrgProfile.org_people.length < 1
  ) {
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

function buildProgramRows({ userId, staffUserId, caseStudy, projectName }) {
  if (isFiscalSponsorshipCaseStudy(caseStudy)) {
    const resolvedProjectName = projectName || FISCAL_CASE_STUDY_PROJECT_NAME
    return [
      {
        user_id: userId,
        title: `${resolvedProjectName} - Fiscal Sponsorship Launch`,
        subtitle:
          "Complete fiscal sponsorship intake, agreement, and restricted-fund setup.",
        description:
          "A case-study launch program for testing prefilled fiscal sponsorship documents and review loops.",
        location: "Chicago, IL",
        location_type: "in_person",
        location_url: null,
        team_ids: [userId, staffUserId],
        duration_label: "Ongoing / multi-year",
        start_date: FISCAL_CASE_STUDY_PROJECT_START,
        end_date: FISCAL_CASE_STUDY_PROJECT_END,
        features: [
          "Project",
          "Fiscal sponsorship",
          "Agreement prefill",
          "DocuSeal signing",
        ],
        status_label: "Submitted for review",
        goal_cents: getFiscalCaseStudyBudgetTotalCents(),
        raised_cents: 1800000,
        is_public: false,
        cta_label: "Review fiscal packet",
        cta_url: "/my-organization",
        wizard_snapshot: {
          title: resolvedProjectName,
          oneSentence:
            "Weekly neighborhood meals and resource nights for Southside families.",
          objectKind: "Project",
          programType: "Community Support",
          coreFormat: "Distribution",
          focusArea:
            "Food access, family resource navigation, and neighborhood mutual aid",
          projectDurationType: "ongoing_multi_year",
          startDate: FISCAL_CASE_STUDY_PROJECT_START,
          endDate: null,
          budgetRows: FISCAL_CASE_STUDY_BUDGET_ROWS,
          fundingGoalCents: getFiscalCaseStudyBudgetTotalCents(),
          fundingSource:
            "Local foundations, individual donors, church partners, and neighborhood sponsorships.",
          successOutcomes: [
            "2,400 meals served in year one",
            "180 household resource referrals completed",
            "45 recurring volunteers retained",
          ],
          staffCount: 3,
          pilotPeopleServed: 260,
        },
      },
      {
        user_id: userId,
        title: "Neighborhood Food and Family Resource Nights",
        subtitle:
          "Weekly meal service paired with benefits and referral navigation.",
        description:
          "Run reliable neighborhood resource nights where families can eat, connect, and get practical support.",
        location: "Southside Community Center",
        location_type: "in_person",
        location_url: null,
        team_ids: [userId, staffUserId],
        duration_label: "Weekly",
        start_date: FISCAL_CASE_STUDY_PROJECT_START,
        end_date: FISCAL_CASE_STUDY_PROJECT_END,
        features: [
          "Service",
          "Meals",
          "Resource navigation",
          "Volunteer operations",
        ],
        status_label: "Active pilot",
        goal_cents: 3200000,
        raised_cents: 1200000,
        is_public: false,
        cta_label: "View details",
        cta_url: null,
        wizard_snapshot: {
          title: "Neighborhood Food and Family Resource Nights",
          oneSentence:
            "A weekly meal and resource-navigation night for families in the Southside service area.",
          objectKind: "Service",
          programType: "Direct Services",
          coreFormat: "Distribution",
          staffCount: 2,
          pilotPeopleServed: 180,
        },
      },
      {
        user_id: userId,
        title: "Youth Stewardship Fellows",
        subtitle:
          "Paid youth leadership shifts that support resource-night operations.",
        description:
          "Train young neighbors to support setup, welcoming, translation, pantry packing, and event closeout.",
        location: "Hybrid",
        location_type: "in_person",
        location_url: null,
        team_ids: [userId, staffUserId],
        duration_label: "12 months",
        start_date: monthStartIso(1),
        end_date: null,
        features: [
          "Program",
          "Youth leadership",
          "Stipends",
          "Community service",
        ],
        status_label: "Planned",
        goal_cents: 1400000,
        raised_cents: 0,
        is_public: false,
        cta_label: "View details",
        cta_url: null,
        wizard_snapshot: {
          title: "Youth Stewardship Fellows",
          oneSentence:
            "A youth-led operations track for neighborhood resource-night delivery.",
          objectKind: "Program",
          programType: "Training & Capacity Building",
          coreFormat: "Workforce Pathway",
          staffCount: 1,
          pilotPeopleServed: 24,
        },
      },
    ]
  }

  return [
    {
      user_id: userId,
      title: "Demo Program - Board Readiness Bootcamp",
      subtitle: "Governance fundamentals for board + staff alignment.",
      description: "Build board operating cadence and decision infrastructure.",
      location: "Hybrid",
      location_type: "in_person",
      location_url: null,
      team_ids: [userId, staffUserId],
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
      description:
        "Run an intake cycle with community validation and reporting.",
      location: "South Hub",
      location_type: "in_person",
      location_url: null,
      team_ids: [userId, staffUserId],
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
}

async function findUserByEmail(adminClient, email) {
  const perPage = 200
  let page = 1

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage,
    })
    if (error) throw new Error(`Unable to list users: ${error.message}`)
    const users = data?.users ?? []
    const match = users.find(
      (user) => (user.email ?? "").toLowerCase() === email.toLowerCase()
    )
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
    const shouldRotatePassword =
      typeof password === "string" && password.trim().length > 0
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

    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      existing.id,
      {
        ...updatePayload,
      }
    )
    if (updateError)
      throw new Error(`Unable to update existing user: ${updateError.message}`)
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
        { onConflict: "id" }
      )
    if (profileUpsertError)
      throw new Error(
        `Unable to upsert existing profile: ${profileUpsertError.message}`
      )
    return {
      user: existing,
      created: false,
      passwordUsed: shouldRotatePassword ? password : null,
    }
  }

  const resolvedPassword =
    typeof password === "string" && password.trim().length > 0
      ? password
      : generateStrongTempPassword()
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
    throw new Error(
      `Unable to create user: ${error?.message ?? "unknown error"}`
    )
  }

  const { error: profileError } = await adminClient.from("profiles").upsert(
    {
      id: data.user.id,
      email,
      full_name: fullName,
      role,
      headline: "Founder and Executive Director",
      timezone,
    },
    { onConflict: "id" }
  )
  if (profileError)
    throw new Error(`Unable to seed profile: ${profileError.message}`)

  return { user: data.user, created: true, passwordUsed: resolvedPassword }
}

async function ensureMemberUser({ adminClient, email, fullName, timezone }) {
  const existing = await findUserByEmail(adminClient, email)
  if (existing) {
    await adminClient.from("profiles").upsert(
      {
        id: existing.id,
        email,
        full_name: fullName,
        role: "member",
        timezone,
      },
      { onConflict: "id" }
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
    throw new Error(
      `Unable to create member user ${email}: ${error?.message ?? "unknown error"}`
    )
  }
  await adminClient.from("profiles").upsert(
    {
      id: data.user.id,
      email,
      full_name: fullName,
      role: "member",
      timezone,
    },
    { onConflict: "id" }
  )
  return data.user
}

async function upsertSingleByMatch({
  adminClient,
  table,
  match,
  payload,
  select = "id",
  errorLabel,
}) {
  let readQuery = adminClient.from(table).select(select)
  for (const [key, value] of Object.entries(match)) {
    readQuery = readQuery.eq(key, value)
  }
  const { data: existing, error: readError } = await readQuery
    .limit(1)
    .maybeSingle()
  if (readError)
    throw new Error(`Unable to read ${errorLabel}: ${readError.message}`)

  if (existing?.id) {
    const { data, error } = await adminClient
      .from(table)
      .update(payload)
      .eq("id", existing.id)
      .select(select)
      .single()
    if (error)
      throw new Error(`Unable to update ${errorLabel}: ${error.message}`)
    return data
  }

  const { data, error } = await adminClient
    .from(table)
    .insert(payload)
    .select(select)
    .single()
  if (error) throw new Error(`Unable to insert ${errorLabel}: ${error.message}`)
  return data
}

function splitFullName(fullName) {
  const parts = String(fullName ?? "")
    .trim()
    .split(/\s+/g)
    .filter(Boolean)
  if (parts.length === 0) return { firstName: "Caleb", lastName: "Hamernick" }
  if (parts.length === 1) return { firstName: parts[0], lastName: "" }
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") }
}

function buildFiscalProjectSourceSnapshot({
  orgName,
  projectName,
  email,
  fullName,
}) {
  return {
    caseStudy: FISCAL_CASE_STUDY_KEY,
    source: "seed-full-account",
    prefillMode: "saved-data-edit-confirm",
    generatedByAi: false,
    org: {
      name: orgName,
      email,
      applicant: fullName,
      formationStatus: "in_progress",
      ein: "36-5550148",
    },
    project: {
      name: projectName,
      startDate: FISCAL_CASE_STUDY_PROJECT_START,
      durationType: "ongoing_multi_year",
      budgetRows: FISCAL_CASE_STUDY_BUDGET_ROWS,
      budgetTotalCents: getFiscalCaseStudyBudgetTotalCents(),
    },
    documents: FISCAL_CASE_STUDY_REQUIRED_DOCUMENTS.map((document) => ({
      key: document.key,
      label: document.label,
      fileName: document.fileName,
    })),
  }
}

async function seedFiscalProjectAssets({ adminClient, userId, projectId }) {
  const assetByDocumentKey = new Map()
  for (const document of FISCAL_CASE_STUDY_REQUIRED_DOCUMENTS) {
    const asset = await upsertSingleByMatch({
      adminClient,
      table: "organization_project_assets",
      match: {
        org_id: userId,
        project_id: projectId,
        name: document.fileName,
      },
      payload: {
        org_id: userId,
        project_id: projectId,
        name: document.fileName,
        description: document.description,
        asset_type: "pdf",
        storage_path: null,
        external_url: `https://example.com/testing123/fiscal-sponsorship/${document.key}.pdf`,
        mime: "application/pdf",
        size_bytes: document.sizeBytes,
        created_by: userId,
        updated_by: userId,
      },
      errorLabel: `fiscal project asset ${document.key}`,
    })
    assetByDocumentKey.set(document.key, asset)
  }
  return assetByDocumentKey
}

async function seedFiscalSponsorshipDocuments({
  adminClient,
  applicationId,
  assetByDocumentKey,
  userId,
  projectId,
}) {
  const { data: existingDocuments, error: readError } = await adminClient
    .from("fiscal_sponsorship_documents")
    .select("id, document_key, kind, version")
    .eq("application_id", applicationId)
  if (readError)
    throw new Error(`Unable to read fiscal documents: ${readError.message}`)

  const existingByKey = new Map(
    (existingDocuments ?? [])
      .filter((document) => document.document_key)
      .map((document) => [document.document_key, document])
  )
  const nextVersionByKind = new Map()
  for (const document of existingDocuments ?? []) {
    const kind = document.kind
    const nextVersion = Math.max(
      nextVersionByKind.get(kind) ?? 1,
      Number(document.version ?? 0) + 1
    )
    nextVersionByKind.set(kind, nextVersion)
  }

  for (const document of FISCAL_CASE_STUDY_REQUIRED_DOCUMENTS) {
    const kind =
      document.key === "grant_request_support" ? "regrant" : "application"
    const existing = existingByKey.get(document.key)
    const asset = assetByDocumentKey.get(document.key)
    const version = existing?.version ?? nextVersionByKind.get(kind) ?? 1
    nextVersionByKind.set(kind, version + 1)
    const payload = {
      application_id: applicationId,
      asset_id: asset?.id ?? null,
      document_key: document.key,
      generated_at: new Date().toISOString(),
      kind,
      metadata: {
        caseStudy: FISCAL_CASE_STUDY_KEY,
        generatedByAi: false,
        requirementLabel: document.label,
        source: "seeded-project-assets",
      },
      mime: "application/pdf",
      org_id: userId,
      project_id: projectId,
      review_status: "pending",
      size_bytes: document.sizeBytes,
      source_snapshot: {
        asset: {
          id: asset?.id ?? null,
          name: document.fileName,
          description: document.description,
        },
        connectedAt: new Date().toISOString(),
        documentKey: document.key,
        source: "project-assets",
      },
      status: "draft",
      storage_path: null,
      title: document.label,
      uploaded_at: new Date().toISOString(),
      uploaded_by: userId,
      version,
    }

    if (existing?.id) {
      const { error } = await adminClient
        .from("fiscal_sponsorship_documents")
        .update(payload)
        .eq("id", existing.id)
      if (error)
        throw new Error(
          `Unable to update fiscal document ${document.key}: ${error.message}`
        )
    } else {
      const { error } = await adminClient
        .from("fiscal_sponsorship_documents")
        .insert(payload)
      if (error)
        throw new Error(
          `Unable to insert fiscal document ${document.key}: ${error.message}`
        )
    }
  }
}

async function seedFiscalProjectTaskRows({
  adminClient,
  userId,
  staffUserId,
  boardUserId,
  projectId,
}) {
  const taskRows = [
    {
      title: "Submit fiscal sponsorship application",
      status: "done",
      priority: "high",
      workstream_name: "Application",
      tag_label: "Complete",
      offsetStart: -10,
      offsetEnd: -8,
      assigneeIds: [userId],
    },
    {
      title: "Review required support documents",
      status: "in-progress",
      priority: "high",
      workstream_name: "Documents",
      tag_label: "Needs review",
      offsetStart: -2,
      offsetEnd: 4,
      assigneeIds: [staffUserId],
    },
    {
      title: "Approve sponsorship application",
      status: "todo",
      priority: "urgent",
      workstream_name: "Coach House review",
      tag_label: "Next",
      offsetStart: 1,
      offsetEnd: 5,
      assigneeIds: [boardUserId],
    },
    {
      title: "Generate prefilled Model C agreement",
      status: "todo",
      priority: "high",
      workstream_name: "Agreement",
      tag_label: "After approval",
      offsetStart: 5,
      offsetEnd: 7,
      assigneeIds: [staffUserId],
    },
    {
      title: "Send DocuSeal signing packet",
      status: "todo",
      priority: "high",
      workstream_name: "Signature",
      tag_label: "After generate",
      offsetStart: 7,
      offsetEnd: 10,
      assigneeIds: [userId, staffUserId],
    },
    {
      title: "Set up restricted fund and first grant request",
      status: "todo",
      priority: "medium",
      workstream_name: "Fund setup",
      tag_label: "Post-signing",
      offsetStart: 12,
      offsetEnd: 18,
      assigneeIds: [userId, staffUserId],
    },
  ]

  const today = new Date()
  for (const [index, task] of taskRows.entries()) {
    const taskRow = await upsertSingleByMatch({
      adminClient,
      table: "organization_tasks",
      match: {
        org_id: userId,
        starter_seed_key: `fiscal-sponsorship-case-study:${index + 1}`,
      },
      payload: {
        org_id: userId,
        project_id: projectId,
        title: task.title,
        description:
          "Seeded fiscal sponsorship walkthrough task for the testing123 case-study organization.",
        task_type: "task",
        status: task.status,
        start_date: addDays(today, task.offsetStart).toISOString().slice(0, 10),
        end_date: addDays(today, task.offsetEnd).toISOString().slice(0, 10),
        priority: task.priority,
        tag_label: task.tag_label,
        workstream_name: task.workstream_name,
        sort_order: index,
        created_source: "starter_seed",
        starter_seed_key: `fiscal-sponsorship-case-study:${index + 1}`,
        starter_seed_version: 1,
        created_by: userId,
        updated_by: userId,
      },
      errorLabel: `fiscal project task ${task.title}`,
    })

    const assigneeRows = task.assigneeIds.map((assigneeId) => ({
      org_id: userId,
      task_id: taskRow.id,
      user_id: assigneeId,
      created_by: userId,
    }))
    const { error: assigneeError } = await adminClient
      .from("organization_task_assignees")
      .upsert(assigneeRows, { onConflict: "task_id,user_id" })
    if (assigneeError) {
      throw new Error(
        `Unable to seed fiscal task assignees: ${assigneeError.message}`
      )
    }
  }
}

async function seedFiscalProjectNotesAndLinks({
  adminClient,
  userId,
  projectId,
}) {
  const notes = [
    {
      title: "Design goal: prefill, then confirm",
      content:
        "This case study should prove that Coach House documents are assembled from existing user, organization, program, budget, and document data. The product should prefill editable fields, let users review or add missing data, and save/sign through the real workflow. It should not AI-generate agreements or support documents.",
    },
    {
      title: "Case-study summary",
      content:
        "Southside Community Table is a community meal and family resource project seeking Model C fiscal sponsorship while its own 501(c)(3) formation is in progress.",
    },
    {
      title: "Superadmin walkthrough path",
      content:
        "Use /organizations as a platform-admin-only operator view. Open the testing123 organization, review the submitted fiscal application and keyed support documents, approve the application, generate the prefilled agreement, then send the DocuSeal packet.",
    },
  ]
  for (const note of notes) {
    await upsertSingleByMatch({
      adminClient,
      table: "organization_project_notes",
      match: {
        org_id: userId,
        project_id: projectId,
        title: note.title,
      },
      payload: {
        org_id: userId,
        project_id: projectId,
        title: note.title,
        content: note.content,
        note_type: "general",
        status: "completed",
        created_by: userId,
        updated_by: userId,
      },
      errorLabel: `fiscal project note ${note.title}`,
    })
  }

  const links = [
    {
      name: "Fiscal sponsorship handbook",
      url: "/fiscal-sponsorship/handbook",
      link_type: "doc",
    },
    {
      name: "Case study public page",
      url: "https://example.com/southside-community-table",
      link_type: "file",
    },
  ]
  for (const link of links) {
    await upsertSingleByMatch({
      adminClient,
      table: "organization_project_quick_links",
      match: {
        org_id: userId,
        project_id: projectId,
        name: link.name,
      },
      payload: {
        org_id: userId,
        project_id: projectId,
        name: link.name,
        url: link.url,
        link_type: link.link_type,
        size_mb: 0,
        created_by: userId,
        updated_by: userId,
      },
      errorLabel: `fiscal project quick link ${link.name}`,
    })
  }
}

async function seedFiscalSponsorshipCaseStudy({
  adminClient,
  userId,
  fullName,
  email,
  staffUser,
  boardUser,
  orgName,
  projectName,
}) {
  const resolvedOrgName = orgName || FISCAL_CASE_STUDY_ORG_NAME
  const resolvedProjectName = projectName || FISCAL_CASE_STUDY_PROJECT_NAME
  const { firstName, lastName } = splitFullName(fullName)
  const sourceSnapshot = buildFiscalProjectSourceSnapshot({
    orgName: resolvedOrgName,
    projectName: resolvedProjectName,
    email,
    fullName,
  })

  const project = await upsertSingleByMatch({
    adminClient,
    table: "organization_projects",
    match: {
      org_id: userId,
      starter_seed_key: "fiscal-sponsorship-case-study",
    },
    payload: {
      org_id: userId,
      canonical_org_id: null,
      project_kind: "standard",
      name: resolvedProjectName,
      description:
        "Community meals, family resource nights, and youth stewardship under a Coach House Model C fiscal sponsorship.",
      status: "active",
      priority: "high",
      progress: 82,
      start_date: FISCAL_CASE_STUDY_PROJECT_START,
      end_date: FISCAL_CASE_STUDY_PROJECT_END,
      client_name: resolvedOrgName,
      type_label: "Fiscal sponsorship",
      duration_label: "Ongoing / multi-year",
      tags: ["Fiscal sponsorship", "Community project", "Prefilled docs"],
      member_labels: [fullName, "Jordan Staff", "Casey Board"],
      task_count: 6,
      created_source: "starter_seed",
      starter_seed_key: "fiscal-sponsorship-case-study",
      starter_seed_version: 1,
      created_by: userId,
      updated_by: userId,
    },
    errorLabel: "fiscal sponsorship case-study project",
  })

  const applicationPayload = {
    org_id: userId,
    project_id: project.id,
    status: "submitted",
    applicant_full_name: fullName,
    applicant_first_name: firstName,
    applicant_last_name: lastName,
    mailing_street_address: "1840 S Community Way",
    mailing_street_address_2: "Suite 2",
    mailing_city: "Chicago",
    mailing_state: "IL",
    mailing_postal_code: "60608",
    phone_number: "(312) 555-0148",
    primary_email: email,
    legal_entity_type: "informal_group_with_ein",
    legal_entity_has_501c3: false,
    formation_status: "501(c)(3) in progress",
    project_name: resolvedProjectName,
    project_duration_type: "ongoing_multi_year",
    temporary_start_date: FISCAL_CASE_STUDY_PROJECT_START,
    temporary_end_date: null,
    focus_area:
      "Food access, family resource navigation, and neighborhood mutual aid",
    project_description:
      "Southside Community Table hosts weekly meals and monthly family resource nights that combine food access, benefits navigation, volunteer coordination, and neighbor-led follow-up for households facing food insecurity.",
    project_location: "Chicago, IL",
    estimated_budget_cents: getFiscalCaseStudyBudgetTotalCents(),
    expense_summary: buildBudgetExpenseSummary(),
    prospective_funding_sources:
      "Local foundations, individual donors, church partners, a neighborhood giving page, and small corporate sponsorships.",
    public_benefit:
      "The project reduces food insecurity, makes resource navigation easier for families, and builds a consistent volunteer network for a neighborhood with limited evening access to services.",
    leadership_background:
      "The applicant and steering committee have experience in community organizing, volunteer coordination, pantry operations, and school-family support partnerships.",
    initiative_history:
      "The work began as a volunteer meal table in spring 2025 and expanded after neighbors requested recurring benefits navigation, translation support, and childcare during resource nights.",
    short_public_description:
      "Southside Community Table brings neighbors together for meals, resource navigation, and practical family support.",
    operates_outside_united_states: false,
    receives_investor_return_funds: false,
    engages_in_lobbying: false,
    has_legal_compliance_financial_concerns: false,
    concerns_explanation: null,
    source_snapshot: sourceSnapshot,
    document_template_payload: {
      generatedByAi: false,
      mode: "prefill-edit-confirm-sign",
      source: "saved_user_org_program_budget_document_data",
      placeholders: {
        applicantName: fullName,
        applicantEmail: email,
        sponsoredEntityName: resolvedOrgName,
        projectName: resolvedProjectName,
        projectBudgetCents: getFiscalCaseStudyBudgetTotalCents(),
        projectStartDate: FISCAL_CASE_STUDY_PROJECT_START,
      },
    },
    review_notes:
      "Seeded case study for superadmin walkthrough. Agreement generation should prefill from saved data and keep user/staff edits explicit.",
    submitted_at: new Date().toISOString(),
    reviewed_by: null,
    reviewed_at: null,
    created_by: userId,
    updated_by: userId,
    metadata: {
      caseStudy: FISCAL_CASE_STUDY_KEY,
      generatedByAi: false,
      designGoal: "Prefilled editable documents, not AI-generated documents.",
    },
  }
  const { data: application, error: applicationError } = await adminClient
    .from("fiscal_sponsorship_applications")
    .upsert(applicationPayload, { onConflict: "org_id,project_id" })
    .select("id")
    .single()
  if (applicationError) {
    throw new Error(
      `Unable to seed fiscal sponsorship application: ${applicationError.message}`
    )
  }

  const assetByDocumentKey = await seedFiscalProjectAssets({
    adminClient,
    userId,
    projectId: project.id,
  })
  await seedFiscalSponsorshipDocuments({
    adminClient,
    applicationId: application.id,
    assetByDocumentKey,
    userId,
    projectId: project.id,
  })
  await seedFiscalProjectTaskRows({
    adminClient,
    userId,
    staffUserId: staffUser.id,
    boardUserId: boardUser.id,
    projectId: project.id,
  })
  await seedFiscalProjectNotesAndLinks({
    adminClient,
    userId,
    projectId: project.id,
  })

  return {
    projectId: project.id,
    applicationId: application.id,
    requiredDocumentCount: FISCAL_CASE_STUDY_REQUIRED_DOCUMENTS.length,
  }
}

async function main() {
  const args = parseArgs(process.argv)
  const dryRun = hasTruthyFlag(args["dry-run"] ?? args.dryRun)
  const caseStudy = isFiscalSponsorshipCaseStudy(
    args["case-study"] ?? args.caseStudy
  )
    ? FISCAL_CASE_STUDY_KEY
    : ""
  const orgName = String(
    args["org-name"] ?? args.orgName ?? FISCAL_CASE_STUDY_ORG_NAME
  ).trim()
  const projectName = String(
    args["project-name"] ?? args.projectName ?? FISCAL_CASE_STUDY_PROJECT_NAME
  ).trim()
  const variantRaw = String(args.variant ?? "with_coaching")
  const variant =
    variantRaw === "without_coaching" || variantRaw === "none"
      ? variantRaw
      : "with_coaching"
  const progressMode =
    String(args.progress ?? "complete") === "mixed" ? "mixed" : "complete"
  const onboardingCompleted =
    String(args.onboarding ?? "complete") !== "incomplete"
  const defaultEmail = `launch.full+${Date.now()}@example.com`
  const email = String(args.email ?? defaultEmail)
    .trim()
    .toLowerCase()
  const passwordArg =
    typeof args.password === "string" && String(args.password).trim().length > 0
      ? String(args.password).trim()
      : null
  const fullName = String(
    args.name ?? (caseStudy ? "Caleb Hamernick" : "Launch QA Account")
  )
  const role =
    String(args.role ?? (caseStudy ? "admin" : "member")) === "admin"
      ? "admin"
      : "member"
  const timezone =
    String(args.timezone ?? "America/Los_Angeles").trim() ||
    "America/Los_Angeles"

  const dotenvLocal = parseEnvFile(path.resolve(process.cwd(), ".env.local"))
  const dotenv = parseEnvFile(path.resolve(process.cwd(), ".env"))
  const envSources = [process.env, dotenvLocal, dotenv]

  const supabaseUrl =
    resolveEnv("SUPABASE_URL", envSources) ||
    resolveEnv("NEXT_PUBLIC_SUPABASE_URL", envSources)
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
    console.log(`case_study: ${caseStudy || "none"}`)
    if (caseStudy) {
      console.log(`org_name: ${orgName}`)
      console.log(`project_name: ${projectName}`)
      console.log(
        `fiscal_required_documents: ${FISCAL_CASE_STUDY_REQUIRED_DOCUMENTS.length}`
      )
    }
    console.log(`progress_mode: ${progressMode}`)
    console.log(
      `onboarding: ${onboardingCompleted ? "complete" : "incomplete"}`
    )
    console.log(`roadmap_sections: ${fixtureValidation.sectionCount}`)
    console.log(
      `roadmap_status_counts: complete=${fixtureValidation.statusCounts.complete},in_progress=${fixtureValidation.statusCounts.in_progress},not_started=${fixtureValidation.statusCounts.not_started}`
    )
    console.log(`documents_seeded: ${fixtureValidation.documentCount}`)
    console.log(`org_people_seeded: ${previewOrgPeople.length}`)
    console.log(
      `duplicate_section_ids: ${fixtureValidation.duplicateSectionIds.length}`
    )
    console.log(
      `duplicate_section_slugs: ${fixtureValidation.duplicateSectionSlugs.length}`
    )
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
    console.error(
      "Required: SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)."
    )
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
  const baseSlugSource =
    args.slug ?? fullName ?? email.split("@")[0] ?? "launch-workspace"
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
    caseStudy,
    orgName,
    projectName,
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
    { onConflict: "user_id" }
  )
  if (orgError)
    throw new Error(`Unable to seed organization: ${orgError.message}`)

  await adminClient.from("organization_memberships").upsert(
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
    { onConflict: "org_id,member_id" }
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
    if (onboardingUpdateError)
      throw new Error(
        `Unable to update onboarding response: ${onboardingUpdateError.message}`
      )
  } else {
    const { error: onboardingInsertError } = await adminClient
      .from("onboarding_responses")
      .insert(onboardingPayload)
    if (onboardingInsertError)
      throw new Error(
        `Unable to insert onboarding response: ${onboardingInsertError.message}`
      )
  }

  const { error: accessSettingsError } = await adminClient
    .from("organization_access_settings")
    .upsert(
      {
        org_id: userId,
        admins_can_invite: true,
        staff_can_manage_calendar: true,
      },
      { onConflict: "org_id" }
    )
  if (accessSettingsError && accessSettingsError.code !== "42P01") {
    throw new Error(
      `Unable to seed organization access settings: ${accessSettingsError.message}`
    )
  }

  await adminClient.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: `cus_seed_${userId.slice(0, 10)}`,
      stripe_subscription_id: `sub_seed_org_${userId.slice(0, 18)}`,
      status: "active",
      metadata: { planName: "Organization" },
    },
    { onConflict: "stripe_subscription_id" }
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
      if (legacyError)
        throw new Error(
          `Unable to seed accelerator purchase (legacy): ${legacyError.message}`
        )
    } else if (accelError) {
      throw new Error(
        `Unable to seed accelerator purchase: ${accelError.message}`
      )
    }
  }

  const programRows = buildProgramRows({
    userId,
    staffUserId: staffUser.id,
    caseStudy,
    projectName,
  })

  const { data: existingPrograms } = await adminClient
    .from("programs")
    .select("id, title")
    .eq("user_id", userId)
    .in(
      "title",
      programRows.map((row) => row.title)
    )
  const existingProgramIdByTitle = new Map(
    (existingPrograms ?? []).map((row) => [row.title, row.id])
  )
  for (const row of programRows) {
    const existingProgramId = existingProgramIdByTitle.get(row.title)
    const write = existingProgramId
      ? adminClient.from("programs").update(row).eq("id", existingProgramId)
      : adminClient.from("programs").insert(row)
    let { error: insertProgramError } = await write
    if (
      insertProgramError &&
      /wizard_snapshot/i.test(insertProgramError.message)
    ) {
      const fallback = { ...row }
      delete fallback.wizard_snapshot
      const retry = existingProgramId
        ? await adminClient
            .from("programs")
            .update(fallback)
            .eq("id", existingProgramId)
        : await adminClient.from("programs").insert(fallback)
      insertProgramError = retry.error
    }
    if (insertProgramError) {
      throw new Error(
        `Unable to seed program "${row.title}": ${insertProgramError.message}`
      )
    }
  }

  const fiscalCaseStudyResult = caseStudy
    ? await seedFiscalSponsorshipCaseStudy({
        adminClient,
        userId,
        fullName,
        email,
        staffUser,
        boardUser,
        orgName,
        projectName,
      })
    : null

  const notificationRows = [
    {
      user_id: userId,
      org_id: userId,
      actor_id: userId,
      type: "launch_seed",
      title: "Launch checklist prepared",
      description:
        "Your workspace has been seeded with launch-ready demo data.",
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
      notificationRows.map((row) => row.title)
    )
  const existingNotificationTitles = new Set(
    (existingNotifications ?? []).map((row) => row.title)
  )
  const missingNotifications = notificationRows.filter(
    (row) => !existingNotificationTitles.has(row.title)
  )
  if (missingNotifications.length > 0) {
    const { error: notificationError } = await adminClient
      .from("notifications")
      .insert(missingNotifications)
    if (notificationError)
      throw new Error(
        `Unable to seed notifications: ${notificationError.message}`
      )
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
      calendarRows.map((row) => row.title)
    )
  const existingEventTitles = new Set(
    (existingEvents ?? []).map((row) => row.title)
  )
  const missingEvents = calendarRows.filter(
    (row) => !existingEventTitles.has(row.title)
  )
  if (missingEvents.length > 0) {
    const { error: eventError } = await adminClient
      .from("roadmap_calendar_internal_events")
      .insert(missingEvents)
    if (eventError)
      throw new Error(`Unable to seed calendar events: ${eventError.message}`)
  }

  const { data: classes, error: classesError } = await adminClient
    .from("classes")
    .select("id, slug, is_published")
    .eq("is_published", true)
  if (classesError)
    throw new Error(`Unable to load classes: ${classesError.message}`)

  const classIds = (classes ?? []).map((row) => row.id)
  if (classIds.length > 0) {
    const { data: existingEnrollments, error: enrollmentReadError } =
      await adminClient
        .from("enrollments")
        .select("class_id")
        .eq("user_id", userId)
        .in("class_id", classIds)
    if (enrollmentReadError)
      throw new Error(
        `Unable to load enrollments: ${enrollmentReadError.message}`
      )

    const existingEnrollmentClassIds = new Set(
      (existingEnrollments ?? []).map((row) => row.class_id)
    )
    const missingEnrollmentRows = classIds
      .filter((classId) => !existingEnrollmentClassIds.has(classId))
      .map((classId) => ({
        user_id: userId,
        class_id: classId,
        status: "active",
      }))
    if (missingEnrollmentRows.length > 0) {
      const { error: enrollmentInsertError } = await adminClient
        .from("enrollments")
        .insert(missingEnrollmentRows)
      if (enrollmentInsertError)
        throw new Error(
          `Unable to seed enrollments: ${enrollmentInsertError.message}`
        )
    }

    const { data: modules, error: modulesError } = await adminClient
      .from("modules")
      .select("id, class_id, idx, title, is_published")
      .eq("is_published", true)
      .in("class_id", classIds)
      .order("class_id", { ascending: true })
      .order("idx", { ascending: true })
    if (modulesError)
      throw new Error(`Unable to load modules: ${modulesError.message}`)

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
          if (status === "not_started" && progressMode !== "complete")
            return null
          const notePrefix =
            status === "completed" ? "Completed note" : "In-progress note"
          return {
            user_id: userId,
            module_id: module.id,
            status,
            completed_at:
              status === "completed"
                ? addDays(new Date(), -(12 - Math.min(index, 12))).toISOString()
                : null,
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
        if (progressInsertError)
          throw new Error(
            `Unable to seed module progress: ${progressInsertError.message}`
          )
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
        if (submissionsError)
          throw new Error(
            `Unable to seed assignment submissions: ${submissionsError.message}`
          )
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
  console.log(`case_study: ${caseStudy || "none"}`)
  if (fiscalCaseStudyResult) {
    console.log(`case_study_org_name: ${orgName}`)
    console.log(`case_study_project_name: ${projectName}`)
    console.log(`case_study_project_id: ${fiscalCaseStudyResult.projectId}`)
    console.log(
      `case_study_application_id: ${fiscalCaseStudyResult.applicationId}`
    )
    console.log(
      `case_study_required_documents: ${fiscalCaseStudyResult.requiredDocumentCount}`
    )
  }
  console.log(`progress_mode: ${progressMode}`)
  console.log(`onboarding: ${onboardingCompleted ? "complete" : "incomplete"}`)
  console.log(`timezone: ${timezone}`)
}

main().catch((error) => {
  console.error("Seed failed:", error instanceof Error ? error.message : error)
  process.exit(1)
})
