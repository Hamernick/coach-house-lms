import type { BuildCollectNavigationItem } from "../types"

export const COLLECT_NAVIGATION_ITEMS: BuildCollectNavigationItem[] = [
  {
    label: "Explore resources",
    description:
      "Find nonprofit organizations, programs, and support near you.",
    href: "/",
  },
  {
    label: "Save a collection",
    description: "Sign in to keep useful resources together in your map.",
    href: "/login?redirect=%2F",
  },
]

export const BUILD_NAVIGATION_ITEMS: BuildCollectNavigationItem[] = [
  {
    label: "Workspace",
    description: "Plan programs, organize documents, and work with your team.",
    href: "/workspace",
  },
  {
    label: "Accelerator",
    description: "Move an early idea toward a durable nonprofit program.",
    href: "/accelerator",
  },
  {
    label: "Pricing",
    description: "Compare workspace plans and operating support.",
    href: "/pricing",
  },
]
