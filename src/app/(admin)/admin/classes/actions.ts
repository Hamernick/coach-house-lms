"use server"

import {
  revalidateClassViews as revalidateClassViewsImpl,
} from "./actions/revalidate"
import {
  createClassAction as createClassActionImpl,
  deleteClassAction as deleteClassActionImpl,
  setClassPublishedAction as setClassPublishedActionImpl,
  moveClassPositionAction as moveClassPositionActionImpl,
  reorderClassesAction as reorderClassesActionImpl,
} from "./actions/basic"
import {
  createClassWizardAction as createClassWizardActionImpl,
  updateClassWizardAction as updateClassWizardActionImpl,
} from "./actions/wizard"

export async function revalidateClassViews(
  ...args: Parameters<typeof revalidateClassViewsImpl>
) {
  return revalidateClassViewsImpl(...args)
}

export async function createClassAction(
  ...args: Parameters<typeof createClassActionImpl>
) {
  return createClassActionImpl(...args)
}

export async function deleteClassAction(
  ...args: Parameters<typeof deleteClassActionImpl>
) {
  return deleteClassActionImpl(...args)
}

export async function setClassPublishedAction(
  ...args: Parameters<typeof setClassPublishedActionImpl>
) {
  return setClassPublishedActionImpl(...args)
}

export async function moveClassPositionAction(
  ...args: Parameters<typeof moveClassPositionActionImpl>
) {
  return moveClassPositionActionImpl(...args)
}

export async function reorderClassesAction(
  ...args: Parameters<typeof reorderClassesActionImpl>
) {
  return reorderClassesActionImpl(...args)
}

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
