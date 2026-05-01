// Barrel exports for module services and types.
export * from "./modules/types"
export { parseAssignmentFields } from "./modules/assignment"
export {
  buildAssignmentSections,
  type AssignmentSection,
} from "./modules/assignment-sections"
export {
  areAssignmentAnswerableFieldsComplete,
  isAssignmentFieldAnswerable,
  isAssignmentFieldAnswered,
  parseAssignmentCompletionMode,
  shouldTreatAssignmentSubmissionAsComplete,
} from "./modules/assignment-completion"
export { getClassModulesForUser } from "./modules/service"
export { markModuleCompleted } from "./modules/progress"
