import type { ModuleAssignmentField } from "../../types"
import { buildAssignmentValues, type AssignmentValues } from "../utils"

export function deriveAssignmentInitialValues(
  fields: ModuleAssignmentField[],
  submission: { answers?: Record<string, unknown> | null } | null | undefined,
): AssignmentValues {
  return buildAssignmentValues(fields, submission?.answers ?? null)
}
