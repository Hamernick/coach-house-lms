// Shared visible tool headings and descriptions; also used by library search.
export const DOCUMENTATION_TOOL_METADATA = {
  "tools/campaigns": {
    title: "Campaign planner",
    description:
      "Turn one audience, message, and action into a campaign brief you can share.",
  },
  "best-practices/compliance": {
    title: "Compliance calendar",
    description:
      "Map common filing dates, assign owners, and export a review calendar. Confirm requirements for your state and organization.",
  },
  "tools/crm": {
    title: "Plan your relationship records",
    description:
      "Decide what to track, why you need it, and who can access it. Build a field dictionary using examples, not real constituent information.",
  },
  "tools/finance": {
    title: "Finance review planner",
    description:
      "Bring your budget, cash, restricted funds, and review responsibilities into one operating plan.",
  },
  "best-practices/frameworks": {
    title: "Logic model builder",
    description:
      "Connect resources and activities to the change you expect. Export a logic model with assumptions and questions to test.",
  },
  "best-practices/fundraising": {
    title: "Fundraising plan",
    description:
      "Set a funding need, build a channel mix, and see the gap your team still needs to close.",
  },
  "tools/hr": {
    title: "Hiring and role planner",
    description:
      "Define a role, estimate its full cost, and plan recruitment, onboarding, and ongoing support.",
  },
  "tools/legal": {
    title: "Prepare for legal help",
    description:
      "Organize the facts, jurisdiction, deadlines, and questions for qualified counsel. Keep sensitive case details out of this browser draft.",
  },
  "best-practices/marketing": {
    title: "Audience and message planner",
    description:
      "Choose an audience, write a message with evidence, and plan a realistic 90-day communications rhythm.",
  },
  "best-practices/measuring-impact": {
    title: "Measurement plan",
    description:
      "Choose an outcome, a practical way to measure it, and the decision your evidence will inform.",
  },
  "tools/networking": {
    title: "Relationship map",
    description:
      "Identify who to connect with, what you can offer, and the next conversation to arrange.",
  },
  "best-practices/partnerships": {
    title: "Partnership brief",
    description:
      "Define a shared purpose, contributions, decision rights, and a review date before drafting an agreement.",
  },
  "tools/social-media": {
    title: "Social content planner",
    description:
      "Turn your audience and message into a manageable content rhythm, with a tracked link and a clear response owner.",
  },
  "best-practices/sustainability": {
    title: "Runway and capacity planner",
    description:
      "Compare your commitments with available money and people. Explore a planning scenario and identify the next decision.",
  },
} as const

export function getDocumentationToolMetadata(slug: string) {
  return DOCUMENTATION_TOOL_METADATA[
    slug as keyof typeof DOCUMENTATION_TOOL_METADATA
  ]
}
