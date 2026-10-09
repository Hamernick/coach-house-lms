import { FIND_PATH } from "@/lib/find/routes"
import type { BuildCollectNavigationItem } from "../types"

export const COLLECT_NAVIGATION_ITEMS: BuildCollectNavigationItem[] = [
  {
    label: "Explore",
    description: "Find local support.",
    href: FIND_PATH,
  },
  {
    label: "Collections",
    description: "Save useful resources.",
    href: `/login?redirect=${encodeURIComponent(FIND_PATH)}`,
  },
]

export const BUILD_NAVIGATION_ITEMS: BuildCollectNavigationItem[] = [
  {
    label: "Workspace",
    description: "Plan and work together.",
    href: "/workspace",
  },
  {
    label: "Accelerator",
    description: "Launch your nonprofit.",
    href: "/accelerator",
  },
  {
    label: "Pricing",
    description: "Find your plan.",
    href: "/pricing",
  },
  {
    label: "Documentation",
    description: "Learn the essentials.",
    href: "/documentation",
  },
]
