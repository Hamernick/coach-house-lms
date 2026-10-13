import type { RoadmapSectionDefinition } from "./types"

export const SECTION_DEFINITIONS: RoadmapSectionDefinition[] = [
  {
    id: "origin_story",
    title: "Origin Story",
    slug: "origin-story",
    subtitle: "How the organization started and what sparked the work.",
    titleExample: "Example: Why we began",
    subtitleExample: "Example: The moment that made the need clear",
    prompt: "Share the story behind the mission.",
    placeholder:
      "Describe the moment or pattern that made the need impossible to ignore, and who was affected. Mention the early steps you took and how the organization took shape.",
  },
  {
    id: "need",
    title: "Need",
    slug: "need",
    subtitle: "The community need or problem you are solving.",
    titleExample: "Example: The need we are addressing",
    subtitleExample: "Example: Who is impacted and what is missing",
    prompt: "Describe the gap you are closing.",
    placeholder:
      "Explain the specific problem, who it impacts, and why existing solutions fall short. Use a concrete example or data point to show urgency and scale.",
  },
  {
    id: "mission_vision_values",
    title: "Mission, Vision, Values",
    slug: "mission-vision-values",
    subtitle: "Your guiding statements and principles.",
    titleExample: "Example: Our mission and vision",
    subtitleExample: "Example: The values that guide our decisions",
    prompt: "State the mission, vision, and values in clear language.",
    placeholder:
      "State the mission in one clear sentence, then describe the vision of the future you are working toward. List 3-5 values and describe how they guide decisions.",
  },
  {
    id: "theory_of_change",
    title: "Theory of Change",
    slug: "theory-of-change",
    subtitle: "How your inputs and activities lead to outcomes.",
    titleExample: "Example: How change happens",
    subtitleExample: "Example: The pathway from inputs to impact",
    prompt: "Explain the logic behind your work.",
    placeholder:
      "Explain the chain from inputs to activities to outcomes, in plain language. Call out the key assumptions you are testing and the indicators that prove progress.",
  },
  {
    id: "program",
    title: "Program",
    slug: "program",
    subtitle: "Core programs, services, and delivery model.",
    titleExample: "Example: Core programs and services",
    subtitleExample: "Example: What we deliver and how",
    prompt: "Outline the programs you run and who they serve.",
    placeholder:
      "Outline the core programs or services, the audience served, and how delivery works. Include reach or volume where you can (participants, sites, sessions).",
  },
  {
    id: "evaluation",
    title: "Evaluation",
    slug: "evaluation",
    subtitle: "How you measure progress and learn.",
    titleExample: "Example: Evaluation approach",
    subtitleExample: "Example: What we track and why",
    prompt: "Describe your evaluation plan and key signals.",
    placeholder:
      "Describe how you measure progress and what data you collect. Note how often you review results and how you use findings to improve.",
  },
  {
    id: "people",
    title: "People",
    slug: "people",
    subtitle: "Team, staffing, and volunteers.",
    titleExample: "Example: Our team and roles",
    subtitleExample: "Example: Who does the work",
    prompt: "Highlight the people and roles needed to deliver the work.",
    placeholder:
      "List the key roles needed now and in the next phase, including staff, volunteers, or advisors. Mention gaps or hires that are most critical to success.",
  },
  {
    id: "budget",
    title: "Budget",
    slug: "budget",
    subtitle: "Current budget and near-term financial plan.",
    titleExample: "Example: Budget summary",
    subtitleExample: "Example: What funding covers",
    prompt: "Summarize the budget and financial priorities.",
    placeholder:
      "Summarize the current budget and the biggest cost drivers. Note the near-term investments that would unlock growth or impact.",
  },
  {
    id: "fundraising",
    title: "Fundraising",
    slug: "fundraising",
    subtitle: "Fundraising approach and priorities.",
    titleExample: "Example: Fundraising overview",
    subtitleExample: "Example: Our fundraising goals",
    prompt: "Explain how you plan to raise the resources you need.",
    placeholder:
      "Explain the mix of funding sources you rely on and the goals for the next cycle. Include any upcoming campaigns, renewals, or grants you are pursuing.",
  },
  {
    id: "fundraising_strategy",
    title: "Strategy",
    slug: "fundraising-strategy",
    subtitle: "Funding strategy and target sources.",
    titleExample: "Example: Funding strategy",
    subtitleExample: "Example: Who we plan to approach",
    prompt: "Detail your fundraising strategy and targets.",
    placeholder:
      "List the top funding targets and how you plan to approach them. Include timelines, expected ask sizes, and what proof points you will share.",
  },
  {
    id: "fundraising_presentation",
    title: "Presentation",
    slug: "fundraising-presentation",
    subtitle: "Pitch deck and narrative for funders.",
    titleExample: "Example: Pitch narrative",
    subtitleExample: "Example: How we present the story",
    prompt: "Outline the presentation materials and key messages.",
    placeholder:
      "Describe the story arc of your pitch and the core messages you want funders to remember. Note which assets are ready (deck, one-pager, demo) and what is missing.",
  },
  {
    id: "fundraising_crm_plan",
    title: "Treasure Map / CRM Plan",
    slug: "treasure-map-crm-plan",
    subtitle: "Prospect list and relationship tracking.",
    titleExample: "Example: CRM and prospect plan",
    subtitleExample: "Example: Tracking relationships and outreach",
    prompt: "Document the CRM plan and prospect pipeline.",
    placeholder:
      "Explain how you track prospects, stages, and follow-ups. Include the size of the pipeline and your cadence for outreach and stewardship.",
  },
  {
    id: "communications",
    title: "Communications",
    slug: "communications",
    subtitle: "Messaging, channels, and outreach cadence.",
    titleExample: "Example: Communications plan",
    subtitleExample: "Example: How we share updates",
    prompt: "Describe how you communicate with stakeholders.",
    placeholder:
      "List the primary audiences, channels, and the frequency of outreach. Include the key messages you want consistent across communications.",
  },
  {
    id: "board_strategy",
    title: "Board Strategy",
    slug: "board-strategy",
    subtitle: "Board structure, recruitment, and governance goals.",
    titleExample: "Example: Board strategy",
    subtitleExample: "Example: Governance priorities",
    prompt: "Summarize board strategy and recruitment goals.",
    placeholder:
      "Describe the ideal board composition and the skills or networks you need. Include recruitment targets and governance improvements you want this year.",
  },
  {
    id: "board_calendar",
    title: "Calendar",
    slug: "board-calendar",
    subtitle: "Board meetings, reporting, and key dates.",
    titleExample: "Example: Board calendar",
    subtitleExample: "Example: Key governance milestones",
    prompt: "List the board calendar and important milestones.",
    placeholder:
      "Outline the cadence for meetings, reporting, and committees. Include key dates for budget approvals, strategy reviews, and annual filings.",
  },
  {
    id: "board_handbook",
    title: "Handbook",
    slug: "board-handbook",
    subtitle: "Board roles, policies, and onboarding.",
    titleExample: "Example: Board handbook",
    subtitleExample: "Example: Role expectations and policies",
    prompt: "Capture board policies and onboarding materials.",
    placeholder:
      "List the policies, expectations, and onboarding materials new board members receive. Note anything that needs to be created or updated.",
  },
  {
    id: "next_actions",
    title: "Next Actions",
    slug: "next-actions",
    subtitle: "Immediate priorities and ownership.",
    titleExample: "Example: Next actions",
    subtitleExample: "Example: What we are doing next",
    prompt: "List the next actions and who owns them.",
    placeholder:
      "List the top 3-7 actions for the next 30-90 days with owners and due dates. Focus on moves that unlock the next section of work.",
  },
]

export const ROADMAP_SECTION_IDS = SECTION_DEFINITIONS.map((section) => section.id)
export const ROADMAP_SECTION_LIMIT = 24

export const SECTION_MAP = new Map<string, RoadmapSectionDefinition>(
  SECTION_DEFINITIONS.map((section) => [section.id, section]),
)

export function getRoadmapSectionDefinition(
  sectionId: string,
): RoadmapSectionDefinition | null {
  const normalized = sectionId.trim()
  if (!normalized) return null
  return SECTION_MAP.get(normalized) ?? null
}
