"use server"

import {
  createClassWizardAction as createClassWizardActionImpl,
} from "./wizard-create"
import {
  updateClassWizardAction as updateClassWizardActionImpl,
} from "./wizard-update"

export async function createClassWizardAction(
  ...args: Parameters<typeof createClassWizardActionImpl>
) {
  return createClassWizardActionImpl(...args)
}

export async function updateClassWizardAction(
  ...args: Parameters<typeof updateClassWizardActionImpl>
) {
  return updateClassWizardActionImpl(...args)
}
