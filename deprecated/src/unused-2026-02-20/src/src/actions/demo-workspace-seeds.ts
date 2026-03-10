export function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

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
  category:
    | "staff"
    | "governing_board"
    | "advisory_board"
    | "volunteers"
    | "supporters"
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

export const DEMO_PEOPLE = [...buildDemoPeopleSeed()]

export const DEMO_NOTIFICATION_SEEDS = [
  {
    title: "Demo · Board packet review due",
    description: "Finalize board packet docs before Thursday meeting.",
    href: "/organization/documents",
    tone: "warning",
    type: "demo_workspace",
  },
  {
    title: "Demo · Program brief approved",
    description: "Board Readiness Bootcamp moved to in progress.",
    href: "/organization",
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

export const DEMO_CALENDAR_EVENT_SEEDS = [
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
