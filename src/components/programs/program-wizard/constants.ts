import type { StepMeta } from "./types"

export const STEPS: StepMeta[] = [
  {
    title: "Program name",
    helper: "Give this program a clear name and one-sentence summary.",
  },
  {
    title: "Type + format",
    helper: "Pick the main way people experience it, then optional add-ons.",
  },
  {
    title: "Audience + outcomes",
    helper: "Describe the participant experience and what changes.",
  },
  {
    title: "Pilot size + staffing",
    helper: "How many people, and who will run it?",
  },
  {
    title: "When + where",
    helper: "Set cadence, start month, and delivery location.",
  },
  {
    title: "Budget + feasibility",
    helper: "Estimate cost and capacity as you type.",
  },
  {
    title: "Review + generate",
    helper: "Generate a concise program brief for your team and funders.",
  },
]

export const DRAFT_STORAGE_KEY = "coach-house:program-wizard-draft:v1"
