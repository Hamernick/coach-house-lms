"use client"

import InfoIcon from "lucide-react/dist/esm/icons/info"
import ListTreeIcon from "lucide-react/dist/esm/icons/list-tree"
import MapIcon from "lucide-react/dist/esm/icons/map"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  FinancePlanCurrentFocusPill,
  FinancePlanStatusLegend,
} from "./finance-plan-current-focus"
import type {
  FinancePlanningView,
  FinancePlanningViewId,
} from "./finance-plan-diagram-data"
import { FinancePlanFinder } from "./finance-plan-finder"
import { FINANCE_PLANNING_VIEWS } from "./finance-plan-views"
import { FinancePrdCoverageNavigator } from "./finance-prd-coverage-navigator"

type FinancePlanNodeTarget = {
  nodeId: string
  viewId: FinancePlanningViewId
}

export function FinancePlanToolbar({
  activeView,
  onFocusNodes,
  onSelectPlanNode,
  onSelectView,
}: {
  activeView: FinancePlanningView
  onFocusNodes: (nodeIds: readonly string[]) => void
  onSelectPlanNode: (target: FinancePlanNodeTarget) => void
  onSelectView: (viewId: FinancePlanningViewId) => void
}) {
  const handleJump = (label: string) => {
    const target = activeView.navigation.find((item) => item.label === label)
    if (target) onFocusNodes(target.nodeIds)
  }

  return (
    <nav
      aria-label="Finance plan canvas controls"
      className="pointer-events-none absolute top-3 right-3 left-3 z-30 flex gap-2 overflow-x-auto pb-2 sm:top-4 sm:left-4 md:right-44 md:max-w-[calc(100%_-_12rem)]"
    >
      <Select
        onValueChange={(value) => onSelectView(value as FinancePlanningViewId)}
        value={activeView.id}
      >
        <SelectTrigger
          aria-label="Planning view"
          className="bg-card pointer-events-auto h-11 min-w-32 rounded-full shadow-sm"
        >
          <MapIcon aria-hidden="true" className="size-4" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          {FINANCE_PLANNING_VIEWS.map((view) => (
            <SelectItem key={view.id} value={view.id}>
              {view.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select onValueChange={handleJump} value="">
        <SelectTrigger
          aria-label={`${activeView.label} graph section`}
          className="bg-card pointer-events-auto h-11 min-w-28 rounded-full shadow-sm"
        >
          <ListTreeIcon aria-hidden="true" className="size-4" />
          <SelectValue placeholder="Jump" />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          {activeView.navigation.map((target) => (
            <SelectItem key={target.label} value={target.label}>
              {target.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <FinancePlanCurrentFocusPill />

      <Popover>
        <PopoverTrigger asChild>
          <Button
            aria-label="About this planning view"
            className="bg-card pointer-events-auto size-11 rounded-full shadow-sm"
            size="icon"
            title="About this planning view"
            type="button"
            variant="outline"
          >
            <InfoIcon aria-hidden="true" className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 rounded-2xl p-4">
          <p className="text-sm font-semibold text-balance">
            {activeView.title}
          </p>
          <p className="text-muted-foreground mt-1 text-xs leading-5 text-pretty">
            {activeView.summary}
          </p>
          <p className="text-muted-foreground mt-3 text-xs text-pretty">
            PRD: {activeView.sourceSection}
          </p>
          <FinancePlanStatusLegend className="mt-3" />
        </PopoverContent>
      </Popover>

      <div className="pointer-events-auto flex shrink-0 gap-2">
        <FinancePrdCoverageNavigator onSelect={onSelectPlanNode} />
        <FinancePlanFinder onSelect={onSelectPlanNode} />
      </div>
    </nav>
  )
}
