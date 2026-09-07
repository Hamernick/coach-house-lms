import type { CampaignPlanDraft } from "../campaign-types"
import { DEFAULT_CAMPAIGN_PLAN } from "./campaign-plan"

export type AdGrantsCampaignGoal =
  | "fundraising"
  | "volunteer-recruitment"
  | "service-access"

const goals = {
  fundraising: {
    name: "Donation campaign",
    audience:
      "People searching for ways to support [your cause] in [your community].",
    action: "Complete a donation through our campaign page.",
    destination:
      "A donation page explaining the specific need, how funds will be used, and the donation process.",
    measure:
      "Track completed donations and donation value. Test the handoff to the donation provider; report visits separately from gifts.",
  },
  "volunteer-recruitment": {
    name: "Volunteer recruitment",
    audience:
      "People searching for [volunteer role] opportunities in [your service area].",
    action: "Submit an application for the published volunteer role.",
    destination:
      "A role page with the commitment, location, requirements, accessibility contact, and application.",
    measure:
      "Track submitted applications, then record qualified applicants and active volunteers separately.",
  },
  "service-access": {
    name: "Program outreach",
    audience:
      "People searching for [your program or service] in [the locations you serve].",
    action: "Register for the program or request an appointment.",
    destination:
      "A program page showing current eligibility, dates or availability, cost, access information, and registration.",
    measure:
      "Track completed registrations or appointment requests. Review attendance, service use, and capacity separately.",
  },
} as const

export function buildAdGrantsCampaignTemplate(
  goal: AdGrantsCampaignGoal,
  current: CampaignPlanDraft
): CampaignPlanDraft {
  const selected = goals[goal]
  return {
    ...DEFAULT_CAMPAIGN_PLAN,
    organizationName: current.organizationName,
    stage: current.stage,
    campaignName: `Google Ad Grants: ${selected.name}`,
    campaignType: goal,
    objective: `Use a focused Search campaign to help the intended audience take this action: ${selected.action} Set a realistic target after a small test.`,
    primaryAudience: selected.audience,
    desiredAction: selected.action,
    offerDestination: selected.destination,
    channelRoles:
      "Google Search reaches people expressing relevant intent. Use closely related search themes, locations the organization can serve, and negative keywords for irrelevant queries. Keep a separate paid account outside this grant plan.",
    budgetCapacity:
      "Up to $10,000 USD/month in eligible Search ad credit, subject to approval and ongoing policies. Set staff time for setup, response, and weekly review. Credit is not cash or a guarantee of spending or results.",
    measurementPlan: selected.measure,
    learningDecision:
      "Review search terms, completed actions, and inquiry quality each week. Fix the message, destination, or response process before expanding.",
  }
}
