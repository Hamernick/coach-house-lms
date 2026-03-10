import { useCallback, useMemo } from "react"

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
      const value = values[field.name]
      if (value === null || value === undefined) return false
      if (typeof value === "string") return value.trim().length > 0
      if (Array.isArray(value)) return value.length > 0
      if (typeof value === "number") return true
      return Boolean(value)
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
