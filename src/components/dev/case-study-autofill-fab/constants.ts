export const QA_AUTOFILL_ALLOWED_EMAILS = new Set([
  "caleb.hamernick@gmail.com",
  "caleb@bandto.com",
])
export const QA_AUTOFILL_TOKEN_KEY = "coachhouse.qaAutofillEnabled"
export const QA_AUTOFILL_FIRST_USE_ACK_KEY =
  "coachhouse.qaAutofillFirstUseAcknowledged.v1"

export const CASE_STUDY = {
  orgName: "Bright Futures Collective",
  orgSlug: "bright-futures-collective",
  tagline: "Powering opportunity for youth",
  firstName: "Leslie",
  lastName: "Monroe",
  fullName: "Leslie Monroe",
  representative: "Jordan Lee",
  ein: "47-2198456",
  phone: "(415) 555-0139",
  accountEmail: "caleb.hamernick@gmail.com",
  publicEmail: "hello@brightfuturescollective.org",
  title: "Founder & Executive Director",
  programTitle: "Community Intake Lab",
  programSubtitle: "Direct Services · Oakland, CA",
  programStatus: "Planned",
  programType: "Direct Services",
  coreFormat: "Cohort",
  locationType: "In person",
  frequency: "Weekly",
  durationLabel: "16 weeks",
  startMonth: "2026-09",
  budgetUsd: "26000",
  peopleServed: "120",
  staffCount: "4",
  fundingGoalUsd: "40000",
  linkedin: "https://www.linkedin.com/in/leslie-monroe-nfp",
  website: "brightfuturescollective.org",
  newsletter: "newsletter.brightfuturescollective.org",
  twitter: "https://x.com/brightfuturesco",
  facebook: "https://facebook.com/brightfuturescollective",
  instagram: "https://instagram.com/brightfuturescollective",
  youtube: "https://youtube.com/@brightfuturescollective",
  tiktok: "https://tiktok.com/@brightfuturescollective",
  github: "https://github.com/brightfuturescollective",
  mission:
    "Bright Futures Collective equips first-generation young adults with mental wellness support, life-skills coaching, and paid career pathways.",
  vision:
    "A future where every young adult transitioning out of instability has community, confidence, and a sustainable path to thrive.",
  values:
    "Dignity first, community-led design, measurable outcomes, and transparent stewardship of funds.",
  need:
    "In Alameda County, opportunity youth face long waitlists for support services and low access to paid pathways, creating compounding housing and employment instability.",
  theoryOfChange:
    "If we provide trauma-informed coaching, practical skill-building, and paid placement pathways, then participants increase stability, completion, and long-term income outcomes.",
  originStory:
    "After years of mentoring youth navigating housing and school disruption, our team saw the same pattern: talent was present, but systems were fragmented. Bright Futures Collective formed to create one coordinated pathway from crisis to stability to employment.",
  programSummary:
    "Our flagship program pairs weekly coaching, employer-partner workshops, and paid apprenticeship placements over 16 weeks.",
  budgetNarrative:
    "Year one budget prioritizes direct-service staffing, participant stipends, and evaluation capacity, with overhead held below 15 percent.",
  city: "Oakland",
  state: "CA",
  country: "United States",
  addressLine1: "1450 Franklin St",
  addressLine2: "Suite 520",
  postalCode: "94612",
  boilerplate:
    "Bright Futures Collective is an Oakland-based nonprofit that helps first-generation young adults build stability through trauma-informed coaching, paid career pathways, and community-rooted support.",
  organizationBio:
    "Bright Futures Collective is a nonprofit workforce and wellness initiative supporting transition-age youth through coaching, paid pathways, and community partnerships.",
} as const

export const LONG_TEXT_FALLBACK = CASE_STUDY.boilerplate
