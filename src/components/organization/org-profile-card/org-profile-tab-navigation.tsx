"use client"

import type BuildingIcon from "lucide-react/dist/esm/icons/building-2"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TabsList, TabsTrigger } from "@/components/ui/tabs"

import type { ProfileTab } from "./types"

export type OrgProfileTabOption = {
  value: ProfileTab
  label: string
  icon: typeof BuildingIcon
}

type OrgProfileTabNavigationProps = {
  tab: ProfileTab
  tabs: OrgProfileTabOption[]
  tabsIdBase: string
  currentTabLabel: string
  onTabChange: (value: string) => void
}

export function OrgProfileTabNavigation({
  tab,
  tabs,
  tabsIdBase,
  currentTabLabel,
  onTabChange,
}: OrgProfileTabNavigationProps) {
  return (
    <>
      <TabsList
        data-tour="org-profile-tabs"
        className="hidden h-10 w-full items-end justify-start gap-3 rounded-none border-b bg-transparent p-0 pl-6 pr-6 text-muted-foreground sm:inline-flex"
      >
        {tabs.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            id={`${tabsIdBase}-trigger-${item.value}`}
            aria-controls={`${tabsIdBase}-content-${item.value}`}
            className="relative -mb-[1px] inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-none border-b-0 bg-transparent px-2 pb-2 pt-1 text-sm font-medium text-muted-foreground shadow-none transition-all duration-200 hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=active]:border-b-[2px] data-[state=active]:border-b-primary data-[state=active]:border-solid data-[state=active]:font-semibold data-[state=active]:text-foreground dark:data-[state=active]:!bg-transparent"
          >
            <item.icon className="h-4 w-4" aria-hidden />
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <div className="flex items-end gap-2 border-b pl-6 pr-6 sm:hidden">
        <div className="inline-flex h-10 items-end whitespace-nowrap pb-2 pt-1 text-sm font-semibold text-foreground" aria-live="polite">
          <span className="-mb-px border-b-2 border-b-primary pb-[2px] transition-all duration-200">{currentTabLabel}</span>
        </div>
        <div className="ml-auto pb-1">
          <Select value={tab} onValueChange={onTabChange}>
            <SelectTrigger data-tour="org-profile-tab-picker" className="h-9 min-w-[160px] bg-muted/60 text-sm font-medium">
              <SelectValue aria-label="Select section" placeholder={currentTabLabel} />
            </SelectTrigger>
            <SelectContent align="end">
              {tabs.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  <span className="flex items-center gap-2">
                    <item.icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                    {item.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </>
  )
}
