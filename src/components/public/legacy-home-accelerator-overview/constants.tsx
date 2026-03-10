import CalendarCheck from "lucide-react/dist/esm/icons/calendar-check"
import CircleDollarSign from "lucide-react/dist/esm/icons/circle-dollar-sign"
import Layers from "lucide-react/dist/esm/icons/layers"
import PanelTop from "lucide-react/dist/esm/icons/panel-top"
import Target from "lucide-react/dist/esm/icons/target"

import type {
  AcceleratorPreviewContext,
  AcceleratorPreviewSlide,
  RoadmapPreviewItem,
} from "./types"

export const ACCELERATOR_PREVIEW_SLIDES: AcceleratorPreviewSlide[] = [
  {
    id: "formation",
    tab: "Formation",
    title: "From formation to funding readiness.",
    subtitle: "Track the essentials in one clean flow.",
    modules: [
      {
        index: 1,
        title: "Naming your NFP",
        description: "Define a clear name, identity, and public framing.",
        status: "completed",
        icon: <Target className="h-5 w-5" aria-hidden />,
      },
      {
        index: 2,
        title: "NFP registration",
        description: "Set structure, legal path, and registration checklist.",
        status: "in_progress",
        icon: <PanelTop className="h-5 w-5" aria-hidden />,
      },
    ],
    steps: [
      { label: "Define mission and legal path", state: "complete" },
      { label: "Set governance foundation", state: "complete" },
      { label: "Build strategic roadmap draft", state: "active" },
      { label: "Align program + funding narrative", state: "pending" },
      { label: "Finalize funder-ready package", state: "pending" },
    ],
  },
  {
    id: "roadmap",
    tab: "Roadmap",
    title: "Keep strategy simple.",
    subtitle: "Track milestones, programs, and readiness signals.",
    modules: [
      {
        index: 3,
        title: "Origin Story",
        description: "Capture why this work matters now and who it serves.",
        status: "completed",
        icon: <Layers className="h-5 w-5" aria-hidden />,
      },
      {
        index: 4,
        title: "Needs statement",
        description: "Define the problem, evidence, and urgency for funders.",
        status: "in_progress",
        icon: <CircleDollarSign className="h-5 w-5" aria-hidden />,
      },
    ],
    steps: [
      { label: "Origin story and problem statement", state: "complete" },
      { label: "Program outcomes and evidence", state: "complete" },
      { label: "Budget + delivery assumptions", state: "complete" },
      { label: "Fundability score review", state: "active" },
      { label: "Board review checkpoint", state: "pending" },
      { label: "Public profile alignment", state: "pending" },
    ],
  },
  {
    id: "support",
    tab: "Support",
    title: "Add coaching when needed.",
    subtitle: "Move faster with accountability and expert support.",
    modules: [
      {
        index: 5,
        title: "Program strategy",
        description: "Align delivery model, impact outcomes, and capacity.",
        status: "not_started",
        icon: <CalendarCheck className="h-5 w-5" aria-hidden />,
      },
      {
        index: 6,
        title: "Coaching + guidance",
        description:
          "Book focused 1:1 support to unblock decisions and move work forward.",
        status: "in_progress",
        icon: <CalendarCheck className="h-5 w-5" aria-hidden />,
        variant: "coaching",
      },
    ],
    steps: [
      { label: "Weekly member programming", state: "complete" },
      { label: "Accelerator pacing plan", state: "complete" },
      { label: "Monthly 1:1 coaching slot", state: "active" },
      { label: "Expert network handoff", state: "pending" },
    ],
  },
]

export const ROADMAP_PREVIEW_ITEMS: RoadmapPreviewItem[] = [
  { label: "Origin Story", state: "complete" },
  { label: "Need", state: "in_progress" },
  { label: "Mission, Vision, Values", state: "in_progress" },
  { label: "Theory of Change", state: "pending" },
  { label: "Program", state: "pending" },
  { label: "Evaluation", state: "pending" },
  { label: "People", state: "pending" },
]

export const PREVIEW_CONTEXT_BY_SLIDE: Record<string, AcceleratorPreviewContext> = {
  formation: {
    label: "What this tab previews",
    detail: "How founders move from initial setup to formation-ready execution.",
    points: ["Module cards + status states", "Checklist-style step flow"],
  },
  roadmap: {
    label: "What this tab previews",
    detail: "How strategic roadmap sections stay visible, ordered, and easy to update.",
    points: ["Roadmap section list structure", "Status markers and sequencing"],
  },
  support: {
    label: "What this tab previews",
    detail: "How coaching support appears inside the product experience.",
    points: ["In-app calendar view", "Day + time slot selection"],
  },
}

export const SUPPORT_CALENDAR_WEEKDAY_LABELS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
]

export const SUPPORT_CALENDAR_EVENT_DAYS = new Set([5, 12, 19, 26])

export const SUPPORT_BOOKING_SLOTS = ["10:00 AM", "1:30 PM", "3:00 PM"]
