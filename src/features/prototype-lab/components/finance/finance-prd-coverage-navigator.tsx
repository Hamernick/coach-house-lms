"use client"

import ArrowLeftIcon from "lucide-react/dist/esm/icons/arrow-left"
import ListChecksIcon from "lucide-react/dist/esm/icons/list-checks"
import SearchIcon from "lucide-react/dist/esm/icons/search"
import TargetIcon from "lucide-react/dist/esm/icons/target"
import WorkflowIcon from "lucide-react/dist/esm/icons/workflow"
import { useId, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

import type { FinancePlanningViewId } from "./finance-plan-diagram-data"
import {
  FINANCE_PLAN_DIAGRAM_INDEX,
  FINANCE_PLAN_DIAGRAM_INDEX_COUNT,
  searchFinancePlanDiagrams,
  type FinancePlanDiagramIndexEntry,
} from "./finance-plan-diagram-index"
import {
  FINANCE_PLAN_OBJECTIVE_INDEX,
  FINANCE_PLAN_OBJECTIVE_INDEX_COUNT,
  searchFinancePlanObjectives,
  type FinancePlanObjectiveIndexEntry,
} from "./finance-plan-objective-index"
import {
  FINANCE_PRD_COVERAGE_INDEX,
  FINANCE_PRD_COVERAGE_INDEX_COUNT,
  searchFinancePrdCoverage,
  type FinancePrdCoverageIndexEntry,
  type FinancePrdCoverageNodeEvidence,
} from "./finance-plan-prd-index"

type FinancePlanNodeTarget = {
  nodeId: string
  viewId: FinancePlanningViewId
}

type FinanceCoverageMode = "diagrams" | "objectives" | "sections"

function formatCount(count: number, label: string) {
  return `${count} ${label}${count === 1 ? "" : "s"}`
}

function getCoverageModeLabel(mode: FinanceCoverageMode) {
  switch (mode) {
    case "objectives":
      return "requested outcomes"
    case "diagrams":
      return "source diagrams"
    default:
      return "PRD sections"
  }
}

function groupEvidenceByView(
  evidence: readonly FinancePrdCoverageNodeEvidence[]
): Array<{
  evidence: FinancePrdCoverageNodeEvidence[]
  viewId: FinancePlanningViewId
  viewLabel: string
}> {
  const groups = new Map<
    FinancePlanningViewId,
    {
      evidence: FinancePrdCoverageNodeEvidence[]
      viewId: FinancePlanningViewId
      viewLabel: string
    }
  >()

  for (const item of evidence) {
    const group = groups.get(item.viewId)
    if (group) {
      group.evidence.push(item)
    } else {
      groups.set(item.viewId, {
        evidence: [item],
        viewId: item.viewId,
        viewLabel: item.viewLabel,
      })
    }
  }

  return Array.from(groups.values())
}

function FinanceCoverageEmptyState({
  mode,
  onClearSearch,
  query,
}: {
  mode: FinanceCoverageMode
  onClearSearch: () => void
  query: string
}) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center px-6 py-10 text-center">
      <p className="text-sm font-medium text-balance">
        No {getCoverageModeLabel(mode)} match “{query.trim()}”.
      </p>
      <p className="text-muted-foreground mt-2 max-w-sm text-sm text-pretty">
        Search a product area, system, test, or release requirement.
      </p>
      <Button
        className="mt-4 min-h-11 rounded-full"
        onClick={onClearSearch}
        type="button"
        variant="outline"
      >
        Clear search
      </Button>
    </div>
  )
}

function FinancePrdSectionList({
  onSelectSection,
  results,
}: {
  onSelectSection: (section: string) => void
  results: readonly FinancePrdCoverageIndexEntry[]
}) {
  return (
    <ol className="space-y-1 p-2 sm:p-3">
      {results.map((entry) => {
        const sourceIndex = FINANCE_PRD_COVERAGE_INDEX.indexOf(entry) + 1
        const viewCount = new Set(
          entry.evidence.map((evidence) => evidence.viewId)
        ).size

        return (
          <li key={entry.section}>
            <Button
              className="h-auto min-h-14 w-full justify-start gap-3 rounded-xl px-3 py-3 text-left whitespace-normal"
              onClick={() => onSelectSection(entry.section)}
              type="button"
              variant="ghost"
            >
              <span className="bg-muted text-muted-foreground grid size-8 shrink-0 place-items-center rounded-lg text-xs tabular-nums">
                {String(sourceIndex).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-balance">
                  {entry.section}
                </span>
                <span className="text-muted-foreground mt-1 block text-xs tabular-nums">
                  {formatCount(entry.evidence.length, "evidence node")} ·{" "}
                  {formatCount(viewCount, "view")}
                </span>
              </span>
            </Button>
          </li>
        )
      })}
    </ol>
  )
}

function FinanceObjectiveList({
  onSelectObjective,
  results,
}: {
  onSelectObjective: (outcome: string) => void
  results: readonly FinancePlanObjectiveIndexEntry[]
}) {
  return (
    <ol className="space-y-1 p-2 sm:p-3">
      {results.map((entry) => {
        const sourceIndex = FINANCE_PLAN_OBJECTIVE_INDEX.indexOf(entry) + 1
        const viewCount = new Set(
          entry.evidence.map((evidence) => evidence.viewId)
        ).size

        return (
          <li key={entry.outcome}>
            <Button
              className="h-auto min-h-16 w-full items-start justify-start gap-3 rounded-xl px-3 py-3 text-left whitespace-normal"
              onClick={() => onSelectObjective(entry.outcome)}
              type="button"
              variant="ghost"
            >
              <span className="bg-muted text-muted-foreground grid size-8 shrink-0 place-items-center rounded-lg text-xs tabular-nums">
                {String(sourceIndex).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-balance">
                  {entry.outcome}
                </span>
                <span className="text-muted-foreground mt-1 line-clamp-2 block text-xs leading-5 text-pretty">
                  {entry.plannedEvidence}
                </span>
                <span className="text-muted-foreground mt-1.5 block text-xs tabular-nums">
                  {formatCount(entry.evidence.length, "evidence node")} ·{" "}
                  {formatCount(viewCount, "view")}
                </span>
              </span>
            </Button>
          </li>
        )
      })}
    </ol>
  )
}

function FinanceDiagramList({
  onSelectDiagram,
  results,
}: {
  onSelectDiagram: (label: string) => void
  results: readonly FinancePlanDiagramIndexEntry[]
}) {
  return (
    <ol className="space-y-1 p-2 sm:p-3">
      {results.map((entry) => {
        const sourceIndex = FINANCE_PLAN_DIAGRAM_INDEX.indexOf(entry) + 1

        return (
          <li key={entry.label}>
            <Button
              className="h-auto min-h-16 w-full items-start justify-start gap-3 rounded-xl px-3 py-3 text-left whitespace-normal"
              onClick={() => onSelectDiagram(entry.label)}
              type="button"
              variant="ghost"
            >
              <span className="bg-muted text-muted-foreground grid size-8 shrink-0 place-items-center rounded-lg text-xs tabular-nums">
                {String(sourceIndex).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-balance">
                  {entry.label}
                </span>
                <span className="text-muted-foreground mt-1 block text-xs leading-5 text-pretty">
                  {entry.sourceSection} · {entry.sourceKind}
                </span>
                <span className="text-muted-foreground mt-1.5 block text-xs tabular-nums">
                  {formatCount(
                    entry.sourceConnectionCount,
                    "source connection"
                  )}
                  {" · "}
                  {formatCount(entry.evidence.length, "graph node")}
                </span>
              </span>
            </Button>
          </li>
        )
      })}
    </ol>
  )
}

function FinanceCoverageEvidence({
  evidence,
  onSelect,
}: {
  evidence: readonly FinancePrdCoverageNodeEvidence[]
  onSelect: (target: FinancePlanNodeTarget) => void
}) {
  const groups = groupEvidenceByView(evidence)

  return (
    <div className="space-y-5 p-4 sm:p-5">
      {groups.map((group) => (
        <section key={group.viewId}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-balance">
              {group.viewLabel}
            </h3>
            <Badge className="rounded-full tabular-nums" variant="outline">
              {formatCount(group.evidence.length, "node")}
            </Badge>
          </div>
          <div className="mt-2 space-y-1">
            {group.evidence.map((item) => (
              <Button
                className="h-auto min-h-11 w-full justify-start rounded-xl px-3 py-2.5 text-left whitespace-normal"
                key={`${item.viewId}:${item.nodeId}`}
                onClick={() =>
                  onSelect({
                    nodeId: item.nodeId,
                    viewId: item.viewId,
                  })
                }
                type="button"
                variant="ghost"
              >
                <ListChecksIcon
                  aria-hidden="true"
                  className="size-4 shrink-0"
                />
                <span className="min-w-0 text-sm text-pretty">
                  {item.nodeTitle}
                </span>
              </Button>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export function FinancePrdCoverageNavigator({
  onSelect,
}: {
  onSelect: (target: FinancePlanNodeTarget) => void
}) {
  const searchInputId = useId()
  const [mode, setMode] = useState<FinanceCoverageMode>("sections")
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [selectedDiagram, setSelectedDiagram] = useState<string | null>(null)
  const [selectedObjective, setSelectedObjective] = useState<string | null>(
    null
  )
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const sectionResults = useMemo(() => searchFinancePrdCoverage(query), [query])
  const objectiveResults = useMemo(
    () => searchFinancePlanObjectives(query),
    [query]
  )
  const diagramResults = useMemo(
    () => searchFinancePlanDiagrams(query),
    [query]
  )
  const selectedSectionEntry = useMemo(
    () =>
      selectedSection
        ? (FINANCE_PRD_COVERAGE_INDEX.find(
            (entry) => entry.section === selectedSection
          ) ?? null)
        : null,
    [selectedSection]
  )
  const selectedObjectiveEntry = useMemo(
    () =>
      selectedObjective
        ? (FINANCE_PLAN_OBJECTIVE_INDEX.find(
            (entry) => entry.outcome === selectedObjective
          ) ?? null)
        : null,
    [selectedObjective]
  )
  const selectedDiagramEntry = useMemo(
    () =>
      selectedDiagram
        ? (FINANCE_PLAN_DIAGRAM_INDEX.find(
            (entry) => entry.label === selectedDiagram
          ) ?? null)
        : null,
    [selectedDiagram]
  )
  const selectedEntry =
    selectedSectionEntry ?? selectedObjectiveEntry ?? selectedDiagramEntry
  const selectedTitle =
    selectedSectionEntry?.section ?? selectedObjective ?? selectedDiagram
  const selectedDescription =
    selectedObjectiveEntry?.plannedEvidence ??
    (selectedDiagramEntry
      ? `${formatCount(selectedDiagramEntry.sourceConnectionCount, "source connection")} represented by ${formatCount(selectedDiagramEntry.graphEdgeCount, "graph edge")}.`
      : null) ??
    (selectedSectionEntry
      ? "Choose a mapped graph node to inspect its evidence."
      : mode === "sections"
        ? `All ${FINANCE_PRD_COVERAGE_INDEX_COUNT} top-level source sections map to graph evidence.`
        : mode === "objectives"
          ? `All ${FINANCE_PLAN_OBJECTIVE_INDEX_COUNT} requested outcomes map to exact graph evidence.`
          : `All ${FINANCE_PLAN_DIAGRAM_INDEX_COUNT} source diagrams map to complete React Flow views.`)

  const resetSelection = () => {
    setSelectedDiagram(null)
    setSelectedObjective(null)
    setSelectedSection(null)
  }

  const handleModeChange = (nextMode: FinanceCoverageMode) => {
    setMode(nextMode)
    setQuery("")
    resetSelection()
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setMode("sections")
      setQuery("")
      resetSelection()
    }
  }

  const handleSelect = (target: FinancePlanNodeTarget) => {
    onSelect(target)
    handleOpenChange(false)
  }

  const hasResults =
    mode === "sections"
      ? sectionResults.length > 0
      : mode === "objectives"
        ? objectiveResults.length > 0
        : diagramResults.length > 0

  return (
    <>
      <Button
        aria-label={`Inspect ${FINANCE_PRD_COVERAGE_INDEX_COUNT} PRD sections, ${FINANCE_PLAN_OBJECTIVE_INDEX_COUNT} requested outcomes, and ${FINANCE_PLAN_DIAGRAM_INDEX_COUNT} source diagrams`}
        className="min-h-11 rounded-full px-3 text-xs"
        data-finance-prd-coverage-trigger="true"
        onClick={() => setOpen(true)}
        size="sm"
        type="button"
        variant="outline"
      >
        <ListChecksIcon aria-hidden="true" className="size-4" />
        <span className="hidden sm:inline">Coverage</span>
        <span className="sm:hidden">PRD</span>
      </Button>

      <Dialog onOpenChange={handleOpenChange} open={open}>
        <DialogContent
          className="w-[calc(100%-2rem)] max-w-2xl gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-2xl"
          data-finance-prd-coverage-mode={mode}
        >
          <DialogHeader className="border-border/70 border-b p-5 pr-14 text-left">
            <div className="flex min-w-0 items-start gap-3">
              {selectedEntry ? (
                <Button
                  aria-label={`Back to ${getCoverageModeLabel(mode)}`}
                  className="size-11 shrink-0"
                  onClick={resetSelection}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <ArrowLeftIcon aria-hidden="true" className="size-4" />
                </Button>
              ) : null}
              <div className="min-w-0 flex-1">
                <DialogTitle className="leading-6 text-balance">
                  {selectedTitle ?? "PRD coverage"}
                </DialogTitle>
                <DialogDescription className="mt-1 text-pretty">
                  {selectedDescription}
                </DialogDescription>
              </div>
            </div>

            {!selectedEntry ? (
              <>
                <div
                  aria-label="PRD coverage categories"
                  className="bg-muted mt-4 grid grid-cols-3 gap-1 rounded-xl p-1"
                  role="group"
                >
                  <Button
                    aria-pressed={mode === "sections"}
                    className="min-h-11 rounded-lg"
                    onClick={() => handleModeChange("sections")}
                    type="button"
                    variant={mode === "sections" ? "secondary" : "ghost"}
                  >
                    <ListChecksIcon aria-hidden="true" className="size-4" />
                    Sections
                    <span className="tabular-nums">
                      {FINANCE_PRD_COVERAGE_INDEX_COUNT}
                    </span>
                  </Button>
                  <Button
                    aria-pressed={mode === "objectives"}
                    className="min-h-11 rounded-lg"
                    onClick={() => handleModeChange("objectives")}
                    type="button"
                    variant={mode === "objectives" ? "secondary" : "ghost"}
                  >
                    <TargetIcon aria-hidden="true" className="size-4" />
                    Objectives
                    <span className="tabular-nums">
                      {FINANCE_PLAN_OBJECTIVE_INDEX_COUNT}
                    </span>
                  </Button>
                  <Button
                    aria-pressed={mode === "diagrams"}
                    className="min-h-11 rounded-lg px-2"
                    onClick={() => handleModeChange("diagrams")}
                    type="button"
                    variant={mode === "diagrams" ? "secondary" : "ghost"}
                  >
                    <WorkflowIcon aria-hidden="true" className="size-4" />
                    Diagrams
                    <span className="tabular-nums">
                      {FINANCE_PLAN_DIAGRAM_INDEX_COUNT}
                    </span>
                  </Button>
                </div>

                <div className="relative mt-3">
                  <label className="sr-only" htmlFor={searchInputId}>
                    Search PRD coverage
                  </label>
                  <SearchIcon
                    aria-hidden="true"
                    className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                  />
                  <Input
                    autoComplete="off"
                    className="h-11 rounded-full pl-9 text-base sm:text-sm"
                    id={searchInputId}
                    name="finance-prd-coverage-search"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={
                      mode === "sections"
                        ? "Search sections and evidence…"
                        : mode === "objectives"
                          ? "Search outcomes and planned evidence…"
                          : "Search source diagrams and graph nodes…"
                    }
                    spellCheck={false}
                    type="search"
                    value={query}
                  />
                </div>
              </>
            ) : null}
          </DialogHeader>

          <ScrollArea
            className="h-[min(34rem,calc(100dvh-12rem))] min-h-0"
            viewportClassName="overscroll-contain"
          >
            {selectedEntry ? (
              <FinanceCoverageEvidence
                evidence={selectedEntry.evidence}
                onSelect={handleSelect}
              />
            ) : hasResults ? (
              mode === "sections" ? (
                <FinancePrdSectionList
                  onSelectSection={setSelectedSection}
                  results={sectionResults}
                />
              ) : mode === "objectives" ? (
                <FinanceObjectiveList
                  onSelectObjective={setSelectedObjective}
                  results={objectiveResults}
                />
              ) : (
                <FinanceDiagramList
                  onSelectDiagram={setSelectedDiagram}
                  results={diagramResults}
                />
              )
            ) : (
              <FinanceCoverageEmptyState
                mode={mode}
                onClearSearch={() => setQuery("")}
                query={query}
              />
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}
