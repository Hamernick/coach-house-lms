import type { DocumentationNavItem, DocumentationNavSection } from "../types"

export const DOCUMENTATION_PATH = "/documentation"

export const DOCUMENTATION_NAVIGATION: DocumentationNavSection[] = [
  {
    id: "get-started",
    title: "Get started",
    items: [
      {
        title: "Quickstart",
        description: "Choose the next step for your nonprofit stage.",
        href: `${DOCUMENTATION_PATH}/quickstart`,
        status: "live",
      },
      {
        title: "Key concepts",
        description: "Learn the terms that shape nonprofit decisions.",
        href: `${DOCUMENTATION_PATH}/key-concepts`,
        status: "live",
      },
    ],
  },
  {
    id: "best-practices",
    title: "Best practices",
    items: [
      {
        title: "Mission",
        description: "Write a mission that guides decisions and programs.",
        href: `${DOCUMENTATION_PATH}/best-practices/mission`,
        status: "live",
      },
      {
        title: "Compliance",
        description: "Build a reliable federal and state compliance rhythm.",
        href: `${DOCUMENTATION_PATH}/best-practices/compliance`,
        status: "live",
      },
      {
        title: "Fundraising",
        description: "Develop ethical, durable sources of support.",
        status: "planned",
      },
      {
        title: "Marketing",
        description: "Reach the people your work is designed to serve.",
        status: "planned",
      },
      {
        title: "Frameworks",
        description: "Turn strategy into repeatable operating systems.",
        status: "planned",
      },
      {
        title: "Measuring impact",
        description: "Connect activities, outcomes, and evidence.",
        status: "planned",
      },
      {
        title: "Sustainability",
        description: "Balance mission, people, money, and capacity.",
        status: "planned",
      },
      {
        title: "Partnerships",
        description: "Build relationships with clear shared value.",
        status: "planned",
      },
    ],
  },
  {
    id: "tools",
    title: "Tools",
    items: [
      {
        title: "Brand identity",
        description: "Create a usable nonprofit brand system.",
        href: `${DOCUMENTATION_PATH}/tools/brand-identity`,
        status: "live",
      },
      {
        title: "Social media",
        description: "Plan channels, content, and governance.",
        status: "planned",
      },
      {
        title: "Networking",
        description: "Build a relationship system around the mission.",
        status: "planned",
      },
      {
        title: "HR",
        description: "Support staff and volunteers responsibly.",
        status: "planned",
      },
      {
        title: "Finance",
        description: "Build budgets, controls, and reporting habits.",
        status: "planned",
      },
      {
        title: "Legal",
        description: "Understand common legal decisions and referrals.",
        status: "planned",
      },
      {
        title: "Campaigns",
        description: "Plan focused, measurable public efforts.",
        status: "planned",
      },
      {
        title: "CRM",
        description: "Choose and maintain a useful relationship record.",
        status: "planned",
      },
    ],
  },
  {
    id: "resources",
    title: "Resources",
    items: [
      {
        title: "Map",
        description: "Explore nonprofit organizations and services.",
        href: "/",
        status: "live",
      },
      {
        title: "Marketplace",
        description: "Find vetted tools, discounts, and services.",
        status: "planned",
      },
    ],
  },
]

export function getDocumentationNavItem(pathname: string) {
  for (const section of DOCUMENTATION_NAVIGATION) {
    const item = section.items.find(({ href }) => href === pathname)
    if (item) return item
  }
  return null
}

export function listLiveDocumentationItems(): DocumentationNavItem[] {
  return DOCUMENTATION_NAVIGATION.flatMap((section) => section.items).filter(
    (item) => item.status === "live"
  )
}
