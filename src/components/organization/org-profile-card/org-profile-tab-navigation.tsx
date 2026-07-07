"use client"

import type BuildingIcon from "lucide-react/dist/esm/icons/building-2"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
        variant="line"
        className="text-muted-foreground hidden h-10 w-full items-end justify-start gap-3 rounded-none border-b bg-transparent p-0 pr-6 pl-6 sm:inline-flex"
      >
        {tabs.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            id={`${tabsIdBase}-trigger-${item.value}`}
            aria-controls={`${tabsIdBase}-content-${item.value}`}
            className="text-muted-foreground focus-visible:ring-ring data-[state=active]:text-foreground after:bg-primary relative inline-flex h-10 items-center justify-center gap-2 rounded-none bg-transparent px-2 pt-1 pb-2 text-sm font-medium whitespace-nowrap shadow-none transition-all duration-200 hover:bg-transparent focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none data-[state=active]:font-semibold data-[state=active]:shadow-none group-data-[variant=default]/tabs-list:data-[state=active]:shadow-none dark:data-[state=active]:!bg-transparent"
          >
            <item.icon className="h-4 w-4" aria-hidden />
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <div className="flex items-end gap-2 border-b pr-6 pl-6 sm:hidden">
        <div
          className="text-foreground inline-flex h-10 items-end pt-1 pb-2 text-sm font-semibold whitespace-nowrap"
          aria-live="polite"
        >
          <span className="border-b-primary -mb-px border-b-2 pb-[2px] transition-all duration-200">
            {currentTabLabel}
          </span>
        </div>
        <div className="ml-auto pb-1">
          <Select value={tab} onValueChange={onTabChange}>
            <SelectTrigger
              data-tour="org-profile-tab-picker"
              className="bg-muted/60 h-9 min-w-[160px] text-sm font-medium"
            >
              <SelectValue
                aria-label="Select section"
                placeholder={currentTabLabel}
              />
            </SelectTrigger>
            <SelectContent align="end">
              {tabs.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  <span className="flex items-center gap-2">
                    <item.icon
                      className="text-muted-foreground h-4 w-4"
                      aria-hidden
                    />
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
