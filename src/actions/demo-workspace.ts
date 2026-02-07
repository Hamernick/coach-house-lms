"use server"

import { revalidatePath } from "next/cache"

import { requireServerSession } from "@/lib/auth"
import { fetchSidebarTree } from "@/lib/academy"
import { canEditOrganization, resolveActiveOrganization } from "@/lib/organization/active-org"
import type { Json } from "@/lib/supabase"
import { seedNextDemoProgramAction } from "@/actions/programs"

type SeedDemoWorkspaceResult =
  | {
      ok: true
      seededPrograms: number
      seededTeam: number
      seededNotifications: number
      seededCalendarEvents: number
      seededEnrollments: number
      seededProgressRows: number
    }
  | { error: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const DEMO_PEOPLE = [
  ...buildDemoPeopleSeed(),
]

function seededName(seed: number) {
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

  const first = FIRST_NAMES[seed % FIRST_NAMES.length]
  const last = LAST_NAMES[(seed * 7 + 3) % LAST_NAMES.length]
  return `${first} ${last}`
}

function makePerson({
  id,
  name,
  title,
  email,
  category,
  reportsToId = null,
}: {
  id: string
  name: string
  title: string
  email: string
  category: "staff" | "governing_board" | "advisory_board" | "volunteers" | "supporters"
  reportsToId?: string | null
}) {
  return {
    id,
    name,
    title,
    email,
    linkedin: null,
    category,
    image: null,
    reportsToId,
    pos: null,
  }
}

function buildDemoPeopleSeed() {
  const people = [
    makePerson({
      id: "demo-ceo",
      name: "Avery Coleman",
      title: "Executive Director",
      email: "avery@demo.org",
      category: "staff",
    }),
    makePerson({
      id: "demo-ops",
      name: "Jordan Ellis",
      title: "Operations Manager",
      email: "jordan@demo.org",
      category: "staff",
      reportsToId: "demo-ceo",
    }),
    makePerson({
      id: "demo-programs",
      name: "Maya Brooks",
      title: "Program Director",
      email: "maya@demo.org",
      category: "staff",
      reportsToId: "demo-ceo",
    }),
    makePerson({
      id: "demo-board-chair",
      name: "Leslie Monroe",
      title: "Board Chair",
      email: "leslie@board.demo.org",
      category: "governing_board",
    }),
    makePerson({
      id: "demo-advisor",
      name: "Riley Martinez",
      title: "Strategic Advisor",
      email: "riley@advisor.demo.org",
      category: "advisory_board",
    }),
  ]

  const staffLeadIds: string[] = []
  for (let idx = 1; idx <= 10; idx += 1) {
    const id = `demo-staff-lead-${idx}`
    staffLeadIds.push(id)
    people.push(
      makePerson({
        id,
        name: seededName(100 + idx),
        title: "Team Lead",
        email: `${id}@demo.org`,
        category: "staff",
        reportsToId: "demo-ceo",
      }),
    )
  }

  for (let idx = 1; idx <= 58; idx += 1) {
    const leadId = staffLeadIds[(idx - 1) % staffLeadIds.length]
    const id = `demo-staff-${idx}`
    people.push(
      makePerson({
        id,
        name: seededName(200 + idx),
        title: idx % 4 === 0 ? "Program Manager" : "Program Specialist",
        email: `${id}@demo.org`,
        category: "staff",
        reportsToId: leadId,
      }),
    )
  }

  for (let idx = 1; idx <= 14; idx += 1) {
    const id = `demo-board-${idx}`
    people.push(
      makePerson({
        id,
        name: seededName(300 + idx),
        title: "Board Member",
        email: `${id}@board.demo.org`,
        category: "governing_board",
        reportsToId: "demo-board-chair",
      }),
    )
  }

  const advisoryLeadIds: string[] = []
  for (let idx = 1; idx <= 4; idx += 1) {
    const id = `demo-advisory-lead-${idx}`
    advisoryLeadIds.push(id)
    people.push(
      makePerson({
        id,
        name: seededName(400 + idx),
        title: "Advisory Lead",
        email: `${id}@advisor.demo.org`,
        category: "advisory_board",
        reportsToId: "demo-advisor",
      }),
    )
  }

  for (let idx = 1; idx <= 16; idx += 1) {
    const leadId = advisoryLeadIds[(idx - 1) % advisoryLeadIds.length]
    const id = `demo-advisory-${idx}`
    people.push(
      makePerson({
        id,
        name: seededName(500 + idx),
        title: "Advisory Member",
        email: `${id}@advisor.demo.org`,
        category: "advisory_board",
        reportsToId: leadId,
      }),
    )
  }

  const volunteerLeadIds: string[] = []
  for (let idx = 1; idx <= 6; idx += 1) {
    const id = `demo-volunteer-lead-${idx}`
    volunteerLeadIds.push(id)
    people.push(
      makePerson({
        id,
        name: seededName(600 + idx),
        title: "Volunteer Lead",
        email: `${id}@volunteer.demo.org`,
        category: "volunteers",
      }),
    )
  }

  for (let idx = 1; idx <= 24; idx += 1) {
    const leadId = volunteerLeadIds[(idx - 1) % volunteerLeadIds.length]
    const id = `demo-volunteer-${idx}`
    people.push(
      makePerson({
        id,
        name: seededName(700 + idx),
        title: "Volunteer",
        email: `${id}@volunteer.demo.org`,
        category: "volunteers",
        reportsToId: leadId,
      }),
    )
  }

  for (let idx = 1; idx <= 26; idx += 1) {
    const id = `demo-supporter-${idx}`
    people.push(
      makePerson({
        id,
        name: seededName(800 + idx),
        title: idx % 3 === 0 ? "Foundation Partner" : "Community Supporter",
        email: `${id}@supporter.demo.org`,
        category: "supporters",
      }),
    )
  }

  return people
}

const DEMO_NOTIFICATION_SEEDS = [
  {
    title: "Demo · Board packet review due",
    description: "Finalize board packet docs before Thursday meeting.",
    href: "/my-organization/documents",
    tone: "warning",
    type: "demo_workspace",
  },
  {
    title: "Demo · Program brief approved",
    description: "Board Readiness Bootcamp moved to in progress.",
    href: "/my-organization",
    tone: "success",
    type: "demo_workspace",
  },
  {
    title: "Demo · Calendar updated",
    description: "Internal milestones were added for this quarter.",
    href: "/roadmap",
    tone: "info",
    type: "demo_workspace",
  },
] as const

const DEMO_CALENDAR_EVENT_SEEDS = [
  {
    title: "Demo · Board meeting",
    description: "Review strategic roadmap and approve next month deliverables.",
    dayOffset: 2,
    durationHours: 1,
  },
  {
    title: "Demo · Grant narrative draft due",
    description: "First complete draft submitted for review.",
    dayOffset: 5,
    durationHours: 1,
  },
  {
    title: "Demo · Team operating review",
    description: "Review program staffing and process bottlenecks.",
    dayOffset: 9,
    durationHours: 1,
  },
  {
    title: "Demo · Program launch checkpoint",
    description: "Validate launch readiness and go/no-go decisions.",
    dayOffset: 14,
    durationHours: 1,
  },
] as const

export async function seedDemoWorkspaceAction(): Promise<SeedDemoWorkspaceResult> {
  const { supabase, session } = await requireServerSession("/my-organization")
  const userId = session.user.id
  const { orgId, role } = await resolveActiveOrganization(supabase, userId)
  if (!canEditOrganization(role)) return { error: "Forbidden" }

  let seededPrograms = 0
  let seededTeam = 0
  let seededNotifications = 0
  let seededCalendarEvents = 0
  let seededEnrollments = 0
  let seededProgressRows = 0

  for (let i = 0; i < 12; i += 1) {
    const programResult = await seedNextDemoProgramAction()
    if ("error" in programResult) {
      if (programResult.error.includes("All demo program stages are already seeded.")) break
      return { error: programResult.error }
    }
    seededPrograms += 1
  }

  const { data: orgRow, error: orgError } = await supabase
    .from("organizations")
    .select("profile")
    .eq("user_id", orgId)
    .maybeSingle<{ profile: Record<string, unknown> | null }>()
  if (orgError) return { error: orgError.message }

  const profile = (orgRow?.profile ?? {}) as Record<string, unknown>
  const existingPeople = Array.isArray(profile.org_people)
    ? profile.org_people.filter((entry) => isRecord(entry))
    : []
  const existingPersonIds = new Set(
    existingPeople
      .map((entry) => (typeof entry.id === "string" ? entry.id : ""))
      .filter(Boolean),
  )

  const missingPeople = DEMO_PEOPLE.filter((person) => !existingPersonIds.has(person.id))
  if (missingPeople.length > 0) {
    const nextPeople = [...existingPeople, ...missingPeople]
    const nextProfile = { ...profile, org_people: nextPeople }
    const { error: upsertProfileError } = await supabase
      .from("organizations")
      .upsert({ user_id: orgId, profile: nextProfile as Json }, { onConflict: "user_id" })
    if (upsertProfileError) return { error: upsertProfileError.message }
    seededTeam = missingPeople.length
  }

  const notificationTitles = DEMO_NOTIFICATION_SEEDS.map((item) => item.title)
  const { data: existingNotifications, error: existingNotificationsError } = await supabase
    .from("notifications")
    .select("title")
    .eq("user_id", userId)
    .in("title", notificationTitles)
    .returns<Array<{ title: string }>>()
  if (existingNotificationsError) return { error: existingNotificationsError.message }

  const existingNotificationTitleSet = new Set((existingNotifications ?? []).map((item) => item.title))
  const missingNotifications = DEMO_NOTIFICATION_SEEDS.filter(
    (item) => !existingNotificationTitleSet.has(item.title),
  )
  if (missingNotifications.length > 0) {
    const now = Date.now()
    const { error: insertNotificationsError } = await supabase
      .from("notifications")
      .insert(
        missingNotifications.map((item, index) => ({
          user_id: userId,
          org_id: orgId,
          actor_id: userId,
          type: item.type,
          title: item.title,
          description: item.description,
          href: item.href,
          tone: item.tone,
          created_at: new Date(now - index * 45 * 60 * 1000).toISOString(),
        })),
      )
    if (insertNotificationsError) return { error: insertNotificationsError.message }
    seededNotifications = missingNotifications.length
  }

  const calendarTitles = DEMO_CALENDAR_EVENT_SEEDS.map((item) => item.title)
  const { data: existingCalendarEvents, error: existingCalendarError } = await supabase
    .from("roadmap_calendar_internal_events")
    .select("title")
    .eq("org_id", orgId)
    .in("title", calendarTitles)
    .returns<Array<{ title: string }>>()
  if (existingCalendarError) return { error: existingCalendarError.message }

  const existingCalendarTitleSet = new Set((existingCalendarEvents ?? []).map((item) => item.title))
  const missingCalendarEvents = DEMO_CALENDAR_EVENT_SEEDS.filter(
    (item) => !existingCalendarTitleSet.has(item.title),
  )
  if (missingCalendarEvents.length > 0) {
    const now = new Date()
    const { error: insertCalendarError } = await supabase
      .from("roadmap_calendar_internal_events")
      .insert(
        missingCalendarEvents.map((item) => {
          const startsAt = addDays(now, item.dayOffset)
          const endsAt = new Date(startsAt)
          endsAt.setHours(startsAt.getHours() + item.durationHours)
          return {
            org_id: orgId,
            title: item.title,
            description: item.description,
            starts_at: startsAt.toISOString(),
            ends_at: endsAt.toISOString(),
            all_day: false,
            status: "active",
            assigned_roles: ["owner", "admin", "staff"],
          }
        }),
      )
    if (insertCalendarError) return { error: insertCalendarError.message }
    seededCalendarEvents = missingCalendarEvents.length
  }

  const classes = await fetchSidebarTree({
    includeDrafts: false,
    forceAdmin: false,
  })
  const classIds = classes.map((klass) => klass.id)
  if (classIds.length > 0) {
    const { data: existingEnrollments, error: enrollmentsError } = await supabase
      .from("enrollments")
      .select("class_id")
      .eq("user_id", userId)
      .in("class_id", classIds)
      .returns<Array<{ class_id: string }>>()
    if (enrollmentsError) return { error: enrollmentsError.message }

    const existingEnrollmentSet = new Set((existingEnrollments ?? []).map((row) => row.class_id))
    const missingEnrollmentIds = classIds.filter((classId) => !existingEnrollmentSet.has(classId))
    if (missingEnrollmentIds.length > 0) {
      const { error: insertEnrollmentError } = await supabase.from("enrollments").insert(
        missingEnrollmentIds.map((classId) => ({
          user_id: userId,
          class_id: classId,
          status: "active",
        })),
      )
      if (insertEnrollmentError) return { error: insertEnrollmentError.message }
      seededEnrollments = missingEnrollmentIds.length
    }
  }

  const moduleIds = classes.flatMap((klass) => klass.modules.map((module) => module.id)).slice(0, 10)
  if (moduleIds.length > 0) {
    const { data: existingProgressRows, error: existingProgressError } = await supabase
      .from("module_progress")
      .select("module_id")
      .eq("user_id", userId)
      .in("module_id", moduleIds)
      .returns<Array<{ module_id: string }>>()
    if (existingProgressError) return { error: existingProgressError.message }

    const existingProgressSet = new Set((existingProgressRows ?? []).map((row) => row.module_id))
    const rowsToInsert = moduleIds
      .map((moduleId, index) => {
        if (existingProgressSet.has(moduleId)) return null
        if (index < 4) {
          return {
            user_id: userId,
            module_id: moduleId,
            status: "completed" as const,
            completed_at: new Date(addDays(new Date(), -(10 - index))).toISOString(),
          }
        }
        if (index < 7) {
          return {
            user_id: userId,
            module_id: moduleId,
            status: "in_progress" as const,
            completed_at: null,
          }
        }
        return null
      })
      .filter((row) => row !== null)

    if (rowsToInsert.length > 0) {
      const { error: insertProgressError } = await supabase.from("module_progress").insert(rowsToInsert)
      if (insertProgressError) return { error: insertProgressError.message }
      seededProgressRows = rowsToInsert.length
    }
  }

  revalidatePath("/my-organization")
  revalidatePath("/my-organization?view=editor&tab=people")
  revalidatePath("/my-organization?view=editor&tab=programs")
  revalidatePath("/people")
  revalidatePath("/roadmap")
  revalidatePath("/accelerator")

  return {
    ok: true,
    seededPrograms,
    seededTeam,
    seededNotifications,
    seededCalendarEvents,
    seededEnrollments,
    seededProgressRows,
  }
}
