import FlagIcon from "lucide-react/dist/esm/icons/flag"
import FlaskConicalIcon from "lucide-react/dist/esm/icons/flask-conical"
import GitMergeIcon from "lucide-react/dist/esm/icons/git-merge"
import ListTodoIcon from "lucide-react/dist/esm/icons/list-todo"
import LockKeyholeIcon from "lucide-react/dist/esm/icons/lock-keyhole"
import RocketIcon from "lucide-react/dist/esm/icons/rocket"
import ShieldCheckIcon from "lucide-react/dist/esm/icons/shield-check"
import TriangleAlertIcon from "lucide-react/dist/esm/icons/triangle-alert"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { FINANCE_PLAN_COMPLETION_COUNTS } from "./finance-plan-completion"
import { FINANCE_PLAN_CUTOVER_COUNTS } from "./finance-plan-cutover"
import { FINANCE_PLAN_FAILURE_STATE_COUNTS } from "./finance-plan-failure-states"
import { FINANCE_PLAN_OPEN_INPUT_COUNTS } from "./finance-plan-open-inputs"
import {
  FINANCE_PLAN_BATCH_READINESS_COUNTS,
  FINANCE_PLAN_GATE_READINESS_COUNTS,
} from "./finance-plan-readiness"
import { FINANCE_PLAN_SECURITY_CONTROL_COUNTS } from "./finance-plan-security-controls"
import { FINANCE_PLAN_TEST_MATRIX_COUNTS } from "./finance-plan-test-matrix"

export type FinancePlanReadinessMode =
  | "batches"
  | "completion"
  | "cutover"
  | "failures"
  | "gates"
  | "inputs"
  | "security"
  | "tests"

const FINANCE_PLAN_READINESS_CATEGORIES = [
  {
    count: FINANCE_PLAN_OPEN_INPUT_COUNTS.total,
    icon: ListTodoIcon,
    label: "Inputs",
    mode: "inputs",
  },
  {
    count: FINANCE_PLAN_BATCH_READINESS_COUNTS.total,
    icon: GitMergeIcon,
    label: "Batches",
    mode: "batches",
  },
  {
    count: FINANCE_PLAN_GATE_READINESS_COUNTS.total,
    icon: ShieldCheckIcon,
    label: "Gates",
    mode: "gates",
  },
  {
    count: FINANCE_PLAN_TEST_MATRIX_COUNTS.total,
    icon: FlaskConicalIcon,
    label: "Tests",
    mode: "tests",
  },
  {
    count: FINANCE_PLAN_SECURITY_CONTROL_COUNTS.total,
    icon: LockKeyholeIcon,
    label: "Security",
    mode: "security",
  },
  {
    count: FINANCE_PLAN_FAILURE_STATE_COUNTS.total,
    icon: TriangleAlertIcon,
    label: "Failures",
    mode: "failures",
  },
  {
    count: FINANCE_PLAN_CUTOVER_COUNTS.total,
    icon: RocketIcon,
    label: "Cutover",
    mode: "cutover",
  },
  {
    count: FINANCE_PLAN_COMPLETION_COUNTS.total,
    icon: FlagIcon,
    label: "Done",
    mode: "completion",
  },
] as const satisfies ReadonlyArray<{
  count: number
  icon: typeof ListTodoIcon
  label: string
  mode: FinancePlanReadinessMode
}>

export function FinancePlanReadinessCategoryNav({
  mode,
  onModeChange,
}: {
  mode: FinancePlanReadinessMode
  onModeChange: (mode: FinancePlanReadinessMode) => void
}) {
  return (
    <Select
      onValueChange={(value) => onModeChange(value as FinancePlanReadinessMode)}
      value={mode}
    >
      <SelectTrigger
        aria-label="Implementation readiness category"
        className="mt-3 w-full"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {FINANCE_PLAN_READINESS_CATEGORIES.map((category) => {
          const Icon = category.icon

          return (
            <SelectItem
              icon={<Icon aria-hidden="true" className="size-4" />}
              key={category.mode}
              value={category.mode}
            >
              {category.label} ({category.count})
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
