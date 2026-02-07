export type MyOrganizationBentoCardId =
  | "profile"
  | "activity"
  | "calendar"
  | "launchRoadmap"
  | "programBuilder"
  | "team"
  | "workspaceActions"

type MyOrganizationBentoCardRule = {
  className: string
  classNameWhenLaunchRoadmapHidden?: string
  description: string
}

export const MY_ORGANIZATION_BENTO_GRID_CLASS =
  "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-flow-dense xl:grid-cols-6 xl:auto-rows-[minmax(120px,auto)]"

export const MY_ORGANIZATION_BENTO_CARD_RULES: Record<
  MyOrganizationBentoCardId,
  MyOrganizationBentoCardRule
> = {
  profile: {
    className: "h-full min-h-[280px] md:min-h-[300px] xl:col-span-3 xl:col-start-1 xl:row-span-2 xl:row-start-1",
    description: "Identity summary + bottom-anchored edit action.",
  },
  activity: {
    className: "h-full min-h-[190px] md:min-h-[210px] xl:col-span-3 xl:col-start-2 xl:row-span-1 xl:row-start-5",
    description: "Recent notifications/activity feed with compact state badges.",
  },
  calendar: {
    className: "h-full min-h-[260px] xl:col-span-2 xl:col-start-5 xl:row-span-2 xl:row-start-3",
    classNameWhenLaunchRoadmapHidden: "h-full min-h-[260px] xl:col-span-2 xl:col-start-5 xl:row-span-3 xl:row-start-3",
    description: "Upcoming events + open/add event controls.",
  },
  launchRoadmap: {
    className: "h-full min-h-[220px] xl:col-span-2 xl:col-start-5 xl:row-span-1 xl:row-start-5",
    description: "Temporary 3-module formation checkpoint card.",
  },
  programBuilder: {
    className: "h-full min-h-[360px] md:min-h-[380px] xl:col-span-3 xl:col-start-2 xl:row-span-2 xl:row-start-3",
    description: "Primary builder surface; central high-priority card.",
  },
  team: {
    className: "h-full min-h-[220px] xl:col-span-3 xl:col-start-4 xl:row-span-2 xl:row-start-1",
    classNameWhenLaunchRoadmapHidden: "h-full min-h-[220px] xl:col-span-3 xl:col-start-4 xl:row-span-2 xl:row-start-1",
    description: "Team snapshot and org-chart entry point.",
  },
  workspaceActions: {
    className: "h-full min-h-[220px] xl:col-span-1 xl:col-start-1 xl:row-span-3 xl:row-start-3",
    classNameWhenLaunchRoadmapHidden: "h-full min-h-[220px] xl:col-span-1 xl:col-start-1 xl:row-span-3 xl:row-start-3",
    description: "Launch-critical shortcuts and operational links.",
  },
}

export function resolveMyOrganizationBentoCardClass(
  id: MyOrganizationBentoCardId,
  options: {
    showLaunchRoadmapCard: boolean
  },
) {
  const rule = MY_ORGANIZATION_BENTO_CARD_RULES[id]
  const resolved = options.showLaunchRoadmapCard
    ? rule.className
    : rule.classNameWhenLaunchRoadmapHidden ?? rule.className
  return `${resolved} min-w-0`
}
