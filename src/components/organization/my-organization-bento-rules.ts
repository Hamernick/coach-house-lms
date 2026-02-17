export type MyOrganizationBentoCardId =
  | "profile"
  | "calendar"
  | "launchRoadmap"
  | "programBuilder"
  | "team"

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
    className: "h-full min-h-[280px] md:col-span-2 md:min-h-[300px] xl:col-span-3 xl:col-start-1 xl:row-span-2 xl:row-start-1",
    description: "Identity summary + bottom-anchored edit action.",
  },
  calendar: {
    className: "h-full min-h-[260px] xl:col-span-3 xl:col-start-1 xl:row-span-1 xl:row-start-3",
    classNameWhenLaunchRoadmapHidden: "h-full min-h-[260px] xl:col-span-6 xl:col-start-1 xl:row-span-1 xl:row-start-3",
    description: "Upcoming events + open/add event controls.",
  },
  launchRoadmap: {
    className: "h-full min-h-[220px] xl:col-span-3 xl:col-start-4 xl:row-span-1 xl:row-start-3",
    description: "Formation + accelerator progress snapshot card.",
  },
  programBuilder: {
    className: "h-full min-h-[360px] md:col-span-2 md:min-h-[380px] xl:col-span-6 xl:col-start-1 xl:row-span-2 xl:row-start-4",
    description: "Primary builder surface; central high-priority card.",
  },
  team: {
    className: "h-full min-h-[220px] xl:col-span-3 xl:col-start-4 xl:row-span-2 xl:row-start-1",
    classNameWhenLaunchRoadmapHidden: "h-full min-h-[220px] xl:col-span-3 xl:col-start-4 xl:row-span-2 xl:row-start-1",
    description: "Team snapshot and org-chart entry point.",
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
