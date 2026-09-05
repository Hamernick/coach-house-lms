// Shared visible tool headings and descriptions; also used by library search.
export const DOCUMENTATION_TOOL_METADATA = {
  "tools/campaigns": {
    title: "Build a decision-ready nonprofit campaign brief",
    description:
      "Connect one objective, audience, action, message, destination, delivery system, safeguards, and learning decision. The draft stays on this device and publishes nothing.",
  },
  "best-practices/compliance": {
    title: "Build your annual compliance rhythm",
    description:
      "Add a few operating facts to create a device-local review plan. The result identifies common federal filing paths and the questions that still require state or professional confirmation.",
  },
  "tools/crm": {
    title: "Define a responsible relationship record",
    description:
      "Connect one system purpose to accountable practices and a generic field dictionary. The draft stays on this device, connects to nothing, and should contain no real constituent information.",
  },
  "tools/finance": {
    title: "Build a reviewable operating-finance rhythm",
    description:
      "Keep restricted and unrestricted resources separate, connect cash planning to operating controls, and prepare better questions for staff, the board, and qualified reviewers. The draft stays on this device and moves no money.",
  },
  "best-practices/frameworks": {
    title: "Choose a framework and build a reviewable program pathway",
    description:
      "Start from the decision you need to support, draft a live logic model, expose assumptions and missing links, then export the work or copy a guarded review prompt.",
  },
  "best-practices/fundraising": {
    title: "Build a transparent fundraising plan",
    description:
      "Set the funding need, assign planning amounts to a small channel mix, and generate a stage-specific action plan. Every number remains an assumption until support is committed.",
  },
  "tools/hr": {
    title: "Build a reviewable role lifecycle",
    description:
      "Define necessary work, working relationship facts, full cost, fair recruitment, onboarding, support, records, safety, and transition. The draft stays on this device and makes no people decisions.",
  },
  "tools/legal": {
    title: "Prepare a responsible matter and referral brief",
    description:
      "Separate facts from assumptions, protect people and evidence, map authority and jurisdiction, and prepare focused questions for qualified counsel. The draft stays on this device and provides no legal advice.",
  },
  "best-practices/marketing": {
    title: "Build a source-backed 90-day communications rhythm",
    description:
      "Define one audience, message, proof point, invitation, and maintainable channel cadence. Then export the brief or copy a guarded AI handoff for human-reviewed drafting.",
  },
  "best-practices/measuring-impact": {
    title: "Connect one decision to an outcome, evidence, and action",
    description:
      "Draft a live evidence chain, estimate respondent burden, expose missing safeguards and limitations, then export the plan or copy a guarded review prompt.",
  },
  "tools/networking": {
    title: "Map a reciprocal nonprofit relationship system",
    description:
      "Define the purpose, community accountability, relationship roles, reciprocal value, accessible invitation, follow-through, safeguards, and human review. The draft stays on this device and contacts no one.",
  },
  "best-practices/partnerships": {
    title:
      "Put the shared purpose, each contribution, and decision rights on one table",
    description:
      "Draft a bounded relationship, expose assumptions and safeguards, schedule reviews, then export the brief or copy a guarded review prompt. The result is preparation for a real agreement, not the agreement itself.",
  },
  "tools/social-media": {
    title: "Build a source-backed social media brief",
    description:
      "Plan the audience, source, action, channel rhythm, accessible content, safeguards, response ownership, tracked link, and human review. The draft stays on this device and is never published.",
  },
  "best-practices/sustainability": {
    title: "Test mission commitments against money, people, and continuity",
    description:
      "Build a transparent planning scenario, keep restricted resources separate, expose capacity and continuity risks, then export the work or copy a guarded review prompt.",
  },
} as const

export function getDocumentationToolMetadata(slug: string) {
  return DOCUMENTATION_TOOL_METADATA[
    slug as keyof typeof DOCUMENTATION_TOOL_METADATA
  ]
}
