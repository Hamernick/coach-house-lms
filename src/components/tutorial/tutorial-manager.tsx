"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Building2Icon from "lucide-react/dist/esm/icons/building-2"
import CircleUserIcon from "lucide-react/dist/esm/icons/circle-user"
import CreditCardIcon from "lucide-react/dist/esm/icons/credit-card"
import FileTextIcon from "lucide-react/dist/esm/icons/file-text"
import HomeIcon from "lucide-react/dist/esm/icons/home"
import LayersIcon from "lucide-react/dist/esm/icons/layers"
import RocketIcon from "lucide-react/dist/esm/icons/rocket"
import RouteIcon from "lucide-react/dist/esm/icons/route"
import SearchIcon from "lucide-react/dist/esm/icons/search"
import ShoppingBagIcon from "lucide-react/dist/esm/icons/shopping-bag"
import SparklesIcon from "lucide-react/dist/esm/icons/sparkles"
import UsersIcon from "lucide-react/dist/esm/icons/users"

import { HighlightTour, type HighlightTourStep } from "@/components/tutorial/highlight-tour"
import { dismissTutorialAction, markTutorialCompletedAction, type TutorialKey } from "@/app/actions/tutorial"

type TutorialStartEventDetail = {
  tutorial?: TutorialKey
}

function normalizeTutorialKey(value: unknown): TutorialKey | null {
  if (
    value === "platform" ||
    value === "dashboard" ||
    value === "my-organization" ||
    value === "roadmap" ||
    value === "documents" ||
    value === "billing" ||
    value === "accelerator" ||
    value === "people" ||
    value === "marketplace"
  ) {
    return value
  }
  return null
}

function getLocalStorageKey(prefix: string, tutorial: TutorialKey) {
  return `coachhouse_${prefix}_${tutorial}`
}

const TOUR_STEPS: Record<TutorialKey, HighlightTourStep[]> = {
  platform: [
    {
      id: "nav-organization",
      selector: '[data-tour="nav-organization"]',
      title: "Organization",
      description: "This is your home base. Update your profile, programs, and documents here.",
      icon: <Building2Icon className="h-5 w-5" aria-hidden />,
    },
    {
      id: "nav-accelerator",
      selector: '[data-tour="nav-accelerator"], [data-tour="nav-documents"]',
      title: "Workspace navigation",
      description: "Use the left rail to move across Organization, People, Documents, and Accelerator.",
      icon: <RouteIcon className="h-5 w-5" aria-hidden />,
    },
    {
      id: "global-search",
      selector: '[data-tour="global-search-button"]',
      title: "Search",
      description: "Press CMD+K to jump anywhere — people, roadmap sections, documents, and more.",
      icon: <SearchIcon className="h-5 w-5" aria-hidden />,
    },
    {
      id: "account-menu",
      selector: '[data-tour="account-menu"]',
      title: "Account settings",
      description: "Update your profile, preferences, and billing from here. You can replay tutorials anytime.",
      icon: <CircleUserIcon className="h-5 w-5" aria-hidden />,
    },
  ],
  dashboard: [
    {
      id: "dashboard-overview",
      selector: '[data-tour="dashboard-overview"]',
      title: "Overview",
      description: "A quick snapshot of your org status with shortcuts to keep momentum.",
      icon: <LayersIcon className="h-5 w-5" aria-hidden />,
    },
    {
      id: "dashboard-stats",
      selector: '[data-tour="dashboard-stats"]',
      title: "Progress at a glance",
      description: "Track programs, people, and how much of your roadmap is drafted.",
      icon: <SparklesIcon className="h-5 w-5" aria-hidden />,
    },
    {
      id: "dashboard-actions",
      selector: '[data-tour="dashboard-actions"]',
      title: "Quick actions",
      description: "Jump into profile edits or publish steps from here.",
      icon: <SparklesIcon className="h-5 w-5" aria-hidden />,
    },
  ],
  "my-organization": [
    {
      id: "dashboard-overview",
      selector: '[data-tour="dashboard-overview"]',
      title: "Organization overview",
      description: "Track status, progress, and key actions from this command center.",
      icon: <LayersIcon className="h-5 w-5" aria-hidden />,
    },
    {
      id: "dashboard-actions",
      selector: '[data-tour="dashboard-actions"]',
      title: "Next actions",
      description: "Jump into high-impact tasks without leaving this page.",
      icon: <LayersIcon className="h-5 w-5" aria-hidden />,
    },
    {
      id: "nav-documents",
      selector: '[data-tour="nav-documents"]',
      title: "Documents filing system",
      description: "Open Documents to manage uploads, roadmap records, and policy files.",
      icon: <Building2Icon className="h-5 w-5" aria-hidden />,
    },
  ],
  roadmap: [
    {
      id: "roadmap-section-picker",
      selector: "#roadmap-section-picker-trigger",
      title: "Jump between sections",
      description: "Use the section picker to move around quickly, especially on mobile.",
      icon: <RouteIcon className="h-5 w-5" aria-hidden />,
    },
  ],
  documents: [
    {
      id: "documents-search",
      selector: '[data-tour="documents-search"], [data-tour="document-verification-letter"]',
      title: "Find documents fast",
      description: "Use search and filters to find uploads, policies, and roadmap records in one place.",
      icon: <FileTextIcon className="h-5 w-5" aria-hidden />,
    },
  ],
  billing: [
    {
      id: "billing-primary-action",
      selector: '[data-tour="billing-primary-action"]',
      title: "Billing portal",
      description: "Open Stripe to manage payment methods, change plan, or cancel/resume your subscription.",
      icon: <CreditCardIcon className="h-5 w-5" aria-hidden />,
    },
    {
      id: "billing-support",
      selector: '[data-tour="billing-support"]',
      title: "Need help?",
      description: "If anything looks off, email support and include your workspace name.",
      icon: <CircleUserIcon className="h-5 w-5" aria-hidden />,
    },
  ],
  accelerator: [
    {
      id: "accelerator-get-started",
      selector: '[data-tour="accelerator-get-started"]',
      title: "Get started",
      description: "Use Overview and Roadmap to orient yourself, then work through classes and modules in order.",
      icon: <RocketIcon className="h-5 w-5" aria-hidden />,
    },
    {
      id: "accelerator-return-home",
      selector: '[data-tour="nav-organization"]',
      title: "Return home",
      description: "Jump back to your organization workspace any time.",
      icon: <HomeIcon className="h-5 w-5" aria-hidden />,
    },
    {
      id: "accelerator-search",
      selector: '[data-tour="global-search-button"]',
      title: "Search",
      description: "Press CMD+K to find information in your account quickly.",
      icon: <SearchIcon className="h-5 w-5" aria-hidden />,
    },
    {
      id: "accelerator-account",
      selector: '[data-tour="account-menu"]',
      title: "Account menu",
      description: "Replay tutorials, manage billing, and update your account settings from here.",
      icon: <CircleUserIcon className="h-5 w-5" aria-hidden />,
    },
  ],
  people: [
    {
      id: "people-org-chart",
      selector: '[data-tour="people-org-chart"]',
      title: "Org chart",
      description: "Use the chart to quickly see reporting lines and team structure.",
      icon: <UsersIcon className="h-5 w-5" aria-hidden />,
    },
    {
      id: "people-add",
      selector: '[data-tour="people-add"]',
      title: "Add people",
      description: "Add staff, board members, advisors, volunteers, and supporters to keep your records current.",
      icon: <UsersIcon className="h-5 w-5" aria-hidden />,
    },
  ],
  marketplace: [
    {
      id: "marketplace-search",
      selector: '[data-tour="marketplace-search"]',
      title: "Search resources",
      description: "Find tools by keyword across legal, fundraising, banking, and more.",
      icon: <SearchIcon className="h-5 w-5" aria-hidden />,
    },
    {
      id: "marketplace-categories",
      selector: '[data-tour="marketplace-categories"]',
      title: "Categories",
      description: "Browse by category to discover recommended tools for your next stage.",
      icon: <ShoppingBagIcon className="h-5 w-5" aria-hidden />,
    },
  ],
}

export function TutorialManager() {
  const [open, setOpen] = useState(false)
  const [activeTutorial, setActiveTutorial] = useState<TutorialKey>("platform")

  const steps = useMemo<HighlightTourStep[]>(() => TOUR_STEPS[activeTutorial] ?? TOUR_STEPS.platform, [activeTutorial])

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<TutorialStartEventDetail>).detail
      const nextTutorial = normalizeTutorialKey(detail?.tutorial) ?? "platform"
      setActiveTutorial(nextTutorial)
      setOpen(true)
    }

    window.addEventListener("coachhouse:tutorial:start", handler as EventListener)
    return () => {
      window.removeEventListener("coachhouse:tutorial:start", handler as EventListener)
    }
  }, [])

  const markDismissed = useCallback(
    (tutorial: TutorialKey) => {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(getLocalStorageKey("tutorial_dismissed", tutorial), "1")
      }
      void dismissTutorialAction(tutorial)
    },
    [],
  )

  const markCompleted = useCallback(
    (tutorial: TutorialKey) => {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(getLocalStorageKey("tutorial_completed", tutorial), "1")
        if (tutorial === "platform") {
          window.localStorage.setItem("coachhouse_tour_completed", "1")
        }
      }
      void markTutorialCompletedAction(tutorial)
    },
    [],
  )

  return (
    <HighlightTour
      open={open}
      steps={steps}
      onOpenChange={setOpen}
      onFinish={() => {
        markCompleted(activeTutorial)
      }}
      onDismiss={() => {
        markDismissed(activeTutorial)
      }}
    />
  )
}
