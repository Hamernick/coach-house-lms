export {
  QA_AUTOFILL_ALLOWED_EMAILS,
  QA_AUTOFILL_FIRST_USE_ACK_KEY,
  QA_AUTOFILL_TOKEN_KEY,
} from "./constants"
export { normalize } from "./dom-utils"
export { fillVisibleControls } from "./fill-controls"
export { ensurePeopleAddSheetOpen, fillPeopleAddSheet } from "./people-sheet"
export { captureAutofillSnapshot, restoreAutofillSnapshot } from "./snapshot"
export type { AutofillSnapshot } from "./types"
