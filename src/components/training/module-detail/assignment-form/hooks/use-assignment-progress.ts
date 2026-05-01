import { useCallback, useMemo } from "react"

import { isAssignmentFieldAnswered } from "@/lib/modules/assignment-completion"
import type { ModuleAssignmentField } from "../../../types"
import type { AssignmentSection } from "../../assignment-sections"
import type { AssignmentValues } from "../../utils"

type AssignmentProgress = {
  total: number
  answered: number
  percent: number
}

type UseAssignmentProgressResult = {
  fieldAnswered: (field: ModuleAssignmentField) => boolean
  overall: AssignmentProgress
}

export function useAssignmentProgress(
  tabSections: AssignmentSection[],
  values: AssignmentValues,
): UseAssignmentProgressResult {
  const fieldAnswered = useCallback(
    (field: ModuleAssignmentField) => {
      return isAssignmentFieldAnswered(field, values)
    },
    [values],
  )

  const overall = useMemo(() => {
    let total = 0
    let answered = 0

    tabSections.forEach((section) => {
      section.fields.forEach((field) => {
        total += 1
        if (fieldAnswered(field)) answered += 1
      })
    })

    return {
      total,
      answered,
      percent: total > 0 ? Math.round((answered / total) * 100) : 0,
    }
  }, [fieldAnswered, tabSections])

  return { fieldAnswered, overall }
}
