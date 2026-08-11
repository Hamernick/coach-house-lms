"use client"

import CircleAlertIcon from "lucide-react/dist/esm/icons/circle-alert"
import CircleCheckBigIcon from "lucide-react/dist/esm/icons/circle-check-big"
import CircleIcon from "lucide-react/dist/esm/icons/circle"
import Clock3Icon from "lucide-react/dist/esm/icons/clock-3"
import FlaskConicalIcon from "lucide-react/dist/esm/icons/flask-conical"
import ScaleIcon from "lucide-react/dist/esm/icons/scale"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

import type { FinancePlanningViewId } from "./finance-plan-diagram-data"
import { FINANCE_PLAN_DECISION_ITEM_COUNTS } from "./finance-plan-decision-progress"
import {
  FINANCE_PLAN_COMPLETION,
  FINANCE_PLAN_COMPLETION_COUNTS,
  type FinancePlanCompletionCriterion,
} from "./finance-plan-completion"
import {
  FINANCE_PLAN_CUTOVER,
  FINANCE_PLAN_CUTOVER_COUNTS,
  type FinancePlanCutoverRule,
} from "./finance-plan-cutover"
import {
  FINANCE_PLAN_FAILURE_STATES,
  FINANCE_PLAN_FAILURE_STATE_COUNTS,
  type FinancePlanFailureState,
} from "./finance-plan-failure-states"
import type {
  FinancePlanDecisionItemState,
  FinancePlanEvidenceState,
} from "./finance-release-plan-data"
import {
  FINANCE_PLAN_OPEN_DECISIONS,
  FINANCE_PLAN_OPEN_INPUT_COUNTS,
  FINANCE_PLAN_OPEN_RESEARCH,
  type FinancePlanOpenInput,
} from "./finance-plan-open-inputs"
import {
  FINANCE_PLAN_BATCH_READINESS,
  FINANCE_PLAN_BATCH_READINESS_COUNTS,
  FINANCE_PLAN_GATE_EVIDENCE_COUNTS,
  FINANCE_PLAN_GATE_READINESS,
  FINANCE_PLAN_GATE_READINESS_COUNTS,
  type FinancePlanBatchReadiness,
  type FinancePlanGateReadiness,
} from "./finance-plan-readiness"
import { FinancePlanReadinessBatchList } from "./finance-plan-readiness-batch-list"
import {
  FinancePlanReadinessCategoryNav,
  type FinancePlanReadinessMode,
} from "./finance-plan-readiness-category-nav"
import { FinancePlanReadinessCompletionList } from "./finance-plan-readiness-completion-list"
import { FinancePlanReadinessCutoverList } from "./finance-plan-readiness-cutover-list"
import { FinancePlanReadinessFailureList } from "./finance-plan-readiness-failure-list"
import { FinancePlanReadinessGateList } from "./finance-plan-readiness-gate-list"
import { FinancePlanReadinessSecurityList } from "./finance-plan-readiness-security-list"
import { FinancePlanReadinessTestList } from "./finance-plan-readiness-test-list"
import {
  FinancePlanResponseTargetButton,
  type FinancePlanResponseTarget,
} from "./finance-plan-response-target-button"
import { FINANCE_PLAN_RESEARCH_ITEM_COUNTS } from "./finance-plan-research-progress"
import {
  FINANCE_PLAN_SECURITY_CONTROLS,
  FINANCE_PLAN_SECURITY_CONTROL_COUNTS,
  type FinancePlanSecurityControl,
} from "./finance-plan-security-controls"
import {
  FINANCE_PLAN_TEST_MATRIX,
  FINANCE_PLAN_TEST_MATRIX_COUNTS,
  type FinancePlanTestArea,
} from "./finance-plan-test-matrix"
import { FinancePlanWaveProgressList } from "./finance-plan-wave-progress-list"
import {
  FINANCE_PLAN_COMPLETION_PERCENTAGE,
  FINANCE_PLAN_WAVE_COUNTS,
  FINANCE_PLAN_WAVES,
  FINANCE_PLAN_WAVE_STATUS_COUNTS,
} from "./finance-plan-wave-progress"

type FinancePlanNodeTarget = {
  nodeId: string
  viewId: FinancePlanningViewId
}

function getEvidenceStateLabel(state: FinancePlanEvidenceState) {
  switch (state) {
    case "collecting":
      return "Collecting"
    case "verified":
      return "Verified"
    default:
      return "Not started"
  }
}

function getEvidenceStateIcon(state: FinancePlanEvidenceState) {
  switch (state) {
    case "collecting":
      return Clock3Icon
    case "verified":
      return CircleCheckBigIcon
    default:
      return CircleIcon
  }
}

function getDecisionStateLabel(state: FinancePlanDecisionItemState) {
  switch (state) {
    case "approved":
      return "Approved"
    case "changes_required":
      return "Changes required"
    default:
      return "Pending"
  }
}

function getDecisionStateIcon(state: FinancePlanDecisionItemState) {
  switch (state) {
    case "approved":
      return CircleCheckBigIcon
    case "changes_required":
      return CircleAlertIcon
    default:
      return CircleIcon
  }
}

function getModeDescription(mode: FinancePlanReadinessMode) {
  if (mode === "waves") {
    return `${FINANCE_PLAN_WAVE_COUNTS.complete} of ${FINANCE_PLAN_WAVE_COUNTS.total} fixed current-wave criteria are production-verified. In-progress work stays unchecked until its named release evidence is complete.`
  }

  if (mode === "inputs") {
    return `${FINANCE_PLAN_OPEN_INPUT_COUNTS.decisions} decisions and ${FINANCE_PLAN_OPEN_INPUT_COUNTS.research} research tracks remain open; ${FINANCE_PLAN_DECISION_ITEM_COUNTS.approved} of ${FINANCE_PLAN_DECISION_ITEM_COUNTS.total} approval criteria approved and ${FINANCE_PLAN_RESEARCH_ITEM_COUNTS.verified} of ${FINANCE_PLAN_RESEARCH_ITEM_COUNTS.total} research items verified.`
  }

  if (mode === "gates") {
    return `${FINANCE_PLAN_GATE_EVIDENCE_COUNTS.verified} of ${FINANCE_PLAN_GATE_EVIDENCE_COUNTS.total} proof items verified; ${FINANCE_PLAN_GATE_READINESS_COUNTS.proven} gates proven, ${FINANCE_PLAN_GATE_READINESS_COUNTS.collecting} collecting, and ${FINANCE_PLAN_GATE_READINESS_COUNTS.notStarted} not started.`
  }

  if (mode === "completion") {
    return `${FINANCE_PLAN_COMPLETION_COUNTS.verified} of ${FINANCE_PLAN_COMPLETION_COUNTS.total} completion criteria verified; ${FINANCE_PLAN_COMPLETION_COUNTS.collecting} collecting and ${FINANCE_PLAN_COMPLETION_COUNTS.notStarted} not started.`
  }

  if (mode === "cutover") {
    return `${FINANCE_PLAN_CUTOVER_COUNTS.verified} of ${FINANCE_PLAN_CUTOVER_COUNTS.total} production cutover rules verified; ${FINANCE_PLAN_CUTOVER_COUNTS.collecting} collecting proof and ${FINANCE_PLAN_CUTOVER_COUNTS.notStarted} not started.`
  }

  if (mode === "tests") {
    return `${FINANCE_PLAN_TEST_MATRIX_COUNTS.verified} of ${FINANCE_PLAN_TEST_MATRIX_COUNTS.total} test areas verified; ${FINANCE_PLAN_TEST_MATRIX_COUNTS.collecting} running and ${FINANCE_PLAN_TEST_MATRIX_COUNTS.notStarted} not started.`
  }

  if (mode === "security") {
    return `${FINANCE_PLAN_SECURITY_CONTROL_COUNTS.verified} of ${FINANCE_PLAN_SECURITY_CONTROL_COUNTS.total} security and privacy controls verified; ${FINANCE_PLAN_SECURITY_CONTROL_COUNTS.collecting} collecting proof and ${FINANCE_PLAN_SECURITY_CONTROL_COUNTS.notStarted} not started.`
  }

  if (mode === "failures") {
    return `${FINANCE_PLAN_FAILURE_STATE_COUNTS.verified} of ${FINANCE_PLAN_FAILURE_STATE_COUNTS.total} failure and empty states verified; ${FINANCE_PLAN_FAILURE_STATE_COUNTS.collecting} collecting proof and ${FINANCE_PLAN_FAILURE_STATE_COUNTS.notStarted} not started.`
  }

  return `Historical seven-batch implementation record: ${FINANCE_PLAN_BATCH_READINESS_COUNTS.ready} ready, ${FINANCE_PLAN_BATCH_READINESS_COUNTS.blocked} blocked, ${FINANCE_PLAN_BATCH_READINESS_COUNTS.inProgress} in progress, and ${FINANCE_PLAN_BATCH_READINESS_COUNTS.merged} merged. It does not determine the current percentage.`
}

function FinancePlanOpenInputGroup({
  description,
  inputs,
  onSelect,
  onSelectResponseTarget,
  responseTargetId,
  title,
}: {
  description: string
  inputs: readonly FinancePlanOpenInput[]
  onSelect: (input: FinancePlanOpenInput) => void
  onSelectResponseTarget: (target: FinancePlanResponseTarget) => void
  responseTargetId: string | null
  title: string
}) {
  const Icon = inputs[0]?.kind === "decision" ? ScaleIcon : FlaskConicalIcon

  if (!inputs.length) return null

  return (
    <section>
      <div className="flex items-start justify-between gap-3 px-4 sm:px-5">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-balance">{title}</h3>
          <p className="text-muted-foreground mt-1 text-xs leading-5 text-pretty">
            {description}
          </p>
        </div>
        <Badge className="shrink-0 rounded-full tabular-nums" variant="outline">
          {inputs.length}
        </Badge>
      </div>

      <ol className="mt-2 space-y-1 px-2 sm:px-3">
        {inputs.map((input) => {
          const isResearch = input.kind === "research"
          const isDecision = input.kind === "decision"

          return (
            <li key={input.nodeId}>
              <div className="border-border/60 rounded-xl border">
                <Button
                  className="h-auto min-h-14 w-full items-start justify-start gap-3 rounded-xl px-3 py-3 text-left whitespace-normal"
                  data-finance-readiness-decision-target={
                    isDecision ? input.nodeId : undefined
                  }
                  data-finance-readiness-research-target={
                    isResearch ? input.nodeId : undefined
                  }
                  onClick={() => onSelect(input)}
                  type="button"
                  variant="ghost"
                >
                  <span className="bg-muted text-muted-foreground grid size-9 shrink-0 place-items-center rounded-lg">
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-balance">
                      {input.title}
                    </span>
                    <span className="text-muted-foreground mt-1 line-clamp-2 block text-xs leading-5 text-pretty">
                      {input.summary}
                    </span>
                    <span className="mt-2 flex flex-wrap gap-1.5">
                      <Badge className="rounded-full" variant="secondary">
                        {input.statusLabel}
                      </Badge>
                      {input.researchItemCounts ? (
                        <Badge
                          className="rounded-full tabular-nums"
                          variant="outline"
                        >
                          {input.researchItemCounts.verified}/
                          {input.researchItemCounts.total} verified
                        </Badge>
                      ) : null}
                      {input.decisionItemCounts ? (
                        <Badge
                          className="rounded-full tabular-nums"
                          variant="outline"
                        >
                          {input.decisionItemCounts.approved}/
                          {input.decisionItemCounts.total} approved
                        </Badge>
                      ) : null}
                      {input.batchLabels.map((batchLabel) => (
                        <Badge
                          className="rounded-full tabular-nums"
                          key={batchLabel}
                          variant="outline"
                        >
                          {batchLabel}
                        </Badge>
                      ))}
                    </span>
                  </span>
                </Button>
                {isResearch ? (
                  <ul
                    className="border-border/70 mx-3 mb-3 space-y-2 border-t pt-3"
                    data-finance-readiness-research-list={input.nodeId}
                  >
                    {input.researchItems.map((item) => {
                      const StateIcon = getEvidenceStateIcon(item.state)

                      return (
                        <li
                          className="text-muted-foreground flex gap-2 text-xs leading-5 text-pretty"
                          data-finance-readiness-research-state={item.state}
                          key={item.id}
                        >
                          <StateIcon
                            aria-hidden="true"
                            className="mt-0.5 size-4 shrink-0"
                          />
                          <span>
                            <span className="sr-only">
                              {getEvidenceStateLabel(item.state)}.{" "}
                            </span>
                            <span className="text-foreground font-medium">
                              {item.kind === "question"
                                ? "Question:"
                                : "Evidence:"}{" "}
                            </span>
                            {item.title}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                ) : isDecision ? (
                  <ul
                    className="border-border/70 mx-3 mb-3 space-y-2 border-t pt-3"
                    data-finance-readiness-decision-list={input.nodeId}
                  >
                    {input.decisionItems.map((item) => {
                      const StateIcon = getDecisionStateIcon(item.state)

                      return (
                        <li
                          className="text-muted-foreground flex items-start gap-2 text-xs leading-5 text-pretty"
                          data-finance-readiness-decision-state={item.state}
                          key={item.id}
                        >
                          <StateIcon
                            aria-hidden="true"
                            className="mt-0.5 size-4 shrink-0"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="sr-only">
                              {getDecisionStateLabel(item.state)}.{" "}
                            </span>
                            {item.title}
                          </span>
                          {item.state !== "approved" ? (
                            <FinancePlanResponseTargetButton
                              onSelect={onSelectResponseTarget}
                              selected={responseTargetId === item.id}
                              target={item}
                            />
                          ) : null}
                        </li>
                      )
                    })}
                  </ul>
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export function FinancePlanReadinessPanel({
  onSelect,
  onSelectResponseTarget,
  responseTargetId,
}: {
  onSelect: (target: FinancePlanNodeTarget) => void
  onSelectResponseTarget: (targetId: string) => void
  responseTargetId: string | null
}) {
  const [mode, setMode] = useState<FinancePlanReadinessMode>("waves")

  const handleInputSelect = (input: FinancePlanOpenInput) => {
    onSelect({ nodeId: input.nodeId, viewId: "roadmap" })
  }

  const handleBatchSelect = (batch: FinancePlanBatchReadiness) => {
    onSelect({ nodeId: batch.batchId, viewId: "roadmap" })
  }

  const handleGateSelect = (gate: FinancePlanGateReadiness) => {
    onSelect({ nodeId: gate.gateId, viewId: "roadmap" })
  }

  const handleCompletionSelect = (
    criterion: FinancePlanCompletionCriterion
  ) => {
    onSelect(criterion.target)
  }

  const handleCutoverSelect = (rule: FinancePlanCutoverRule) => {
    onSelect(rule.target)
  }

  const handleTestSelect = (area: FinancePlanTestArea) => {
    onSelect(area.target)
  }

  const handleSecuritySelect = (control: FinancePlanSecurityControl) => {
    onSelect(control.target)
  }

  const handleFailureSelect = (failureState: FinancePlanFailureState) => {
    onSelect(failureState.target)
  }

  return (
    <aside
      aria-label="Implementation plan"
      className="border-border/70 bg-background flex max-h-72 shrink-0 flex-col border-b lg:h-full lg:max-h-none lg:w-80 lg:border-r lg:border-b-0 xl:w-96"
      data-finance-readiness-mode={mode}
      data-finance-readiness-panel="true"
    >
      <header className="border-border/70 shrink-0 border-b p-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="min-w-0 text-sm font-semibold text-balance">
            Current release progress
          </h2>
          <Badge
            className="shrink-0 rounded-full tabular-nums"
            variant="outline"
          >
            {FINANCE_PLAN_COMPLETION_PERCENTAGE}% complete
          </Badge>
        </div>

        <p className="text-muted-foreground mt-1.5 text-xs leading-5 text-pretty">
          {FINANCE_PLAN_WAVE_COUNTS.complete}/{FINANCE_PLAN_WAVE_COUNTS.total}{" "}
          verified · {FINANCE_PLAN_WAVE_COUNTS.inProgress} in progress ·{" "}
          {FINANCE_PLAN_WAVE_STATUS_COUNTS.active} active waves
        </p>

        <FinancePlanReadinessCategoryNav mode={mode} onModeChange={setMode} />
      </header>

      <ScrollArea
        className="min-h-0 flex-1"
        viewportClassName="overscroll-contain"
      >
        <p className="border-border/70 text-muted-foreground border-b px-4 py-3 text-xs leading-5 text-pretty">
          {getModeDescription(mode)}
        </p>
        {mode === "waves" ? (
          <FinancePlanWaveProgressList waves={FINANCE_PLAN_WAVES} />
        ) : mode === "failures" ? (
          <FinancePlanReadinessFailureList
            failureStates={FINANCE_PLAN_FAILURE_STATES}
            onSelect={handleFailureSelect}
          />
        ) : mode === "security" ? (
          <FinancePlanReadinessSecurityList
            controls={FINANCE_PLAN_SECURITY_CONTROLS}
            onSelect={handleSecuritySelect}
          />
        ) : mode === "tests" ? (
          <FinancePlanReadinessTestList
            areas={FINANCE_PLAN_TEST_MATRIX}
            onSelect={handleTestSelect}
          />
        ) : mode === "cutover" ? (
          <FinancePlanReadinessCutoverList
            onSelect={handleCutoverSelect}
            rules={FINANCE_PLAN_CUTOVER}
          />
        ) : mode === "completion" ? (
          <FinancePlanReadinessCompletionList
            criteria={FINANCE_PLAN_COMPLETION}
            onSelect={handleCompletionSelect}
          />
        ) : mode === "batches" ? (
          <FinancePlanReadinessBatchList
            batches={FINANCE_PLAN_BATCH_READINESS}
            onSelect={handleBatchSelect}
            onSelectResponseTarget={(item) => onSelectResponseTarget(item.id)}
            responseTargetId={responseTargetId}
          />
        ) : mode === "gates" ? (
          <FinancePlanReadinessGateList
            gates={FINANCE_PLAN_GATE_READINESS}
            onSelect={handleGateSelect}
          />
        ) : FINANCE_PLAN_OPEN_INPUT_COUNTS.total ? (
          <div className="space-y-6 py-4 sm:py-5">
            <FinancePlanOpenInputGroup
              description="Product, release, fiscal, and visual choices that cannot be assumed during implementation."
              inputs={FINANCE_PLAN_OPEN_DECISIONS}
              onSelect={handleInputSelect}
              onSelectResponseTarget={(item) => onSelectResponseTarget(item.id)}
              responseTargetId={responseTargetId}
              title="Need from you"
            />
            <FinancePlanOpenInputGroup
              description="Evidence and external verification that must be completed before coding each batch."
              inputs={FINANCE_PLAN_OPEN_RESEARCH}
              onSelect={handleInputSelect}
              onSelectResponseTarget={(item) => onSelectResponseTarget(item.id)}
              responseTargetId={responseTargetId}
              title="Research before coding"
            />
          </div>
        ) : (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 py-10 text-center">
            <CircleCheckBigIcon
              aria-hidden="true"
              className="text-muted-foreground size-6"
            />
            <p className="mt-3 text-sm font-medium text-balance">
              All implementation inputs are resolved.
            </p>
            <Button
              className="mt-4 min-h-11 rounded-full"
              onClick={() => setMode("waves")}
              type="button"
              variant="outline"
            >
              Review current waves
            </Button>
          </div>
        )}
      </ScrollArea>
    </aside>
  )
}
