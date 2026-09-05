// Shared visible tool headings and descriptions; also used by library search.
export const DOCUMENTATION_TOOL_METADATA = {
  "tools/campaigns": {
    title: "Campaign planner",
    description: "Plan your audience, message, and action.",
  },
  "best-practices/compliance": {
    title: "Compliance calendar",
    description: "Schedule filings, assign owners, and verify requirements.",
  },
  "tools/crm": {
    title: "Plan your relationship records",
    description: "Plan contact fields and access using fictional records.",
  },
  "tools/finance": {
    title: "Finance review planner",
    description: "Plan your budget and cash flow.",
  },
  "best-practices/frameworks": {
    title: "Logic model builder",
    description: "Connect your resources, activities, and intended results.",
  },
  "best-practices/fundraising": {
    title: "Fundraising plan",
    description: "Plan how to meet your funding goal.",
  },
  "tools/hr": {
    title: "Hiring and role planner",
    description: "Plan roles, hiring costs, and staff support.",
  },
  "tools/legal": {
    title: "Prepare for legal help",
    description: "Prepare for counsel without entering sensitive case details.",
  },
  "best-practices/marketing": {
    title: "Audience and message planner",
    description: "Plan your audience, message, and outreach.",
  },
  "best-practices/measuring-impact": {
    title: "Measurement plan",
    description: "Choose what to measure and why.",
  },
  "tools/networking": {
    title: "Relationship map",
    description: "Map connections and plan your next conversation.",
  },
  "best-practices/partnerships": {
    title: "Partnership brief",
    description: "Agree on purpose, contributions, decisions, and timelines.",
  },
  "tools/social-media": {
    title: "Social content planner",
    description: "Plan posts, track responses, and assign follow-up.",
  },
  "best-practices/sustainability": {
    title: "Runway and capacity planner",
    description: "Compare commitments, cash, and staffing to plan ahead.",
  },
} as const

export function getDocumentationToolMetadata(slug: string) {
  return DOCUMENTATION_TOOL_METADATA[
    slug as keyof typeof DOCUMENTATION_TOOL_METADATA
  ]
}
