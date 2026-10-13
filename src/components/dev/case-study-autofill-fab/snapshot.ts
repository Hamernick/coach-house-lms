import { getVisibleAutofillControls, isVisible, setFieldValue } from "./dom-utils"
import type { AutofillSnapshot } from "./types"

export function captureAutofillSnapshot(pathname: string): AutofillSnapshot {
  const controls = getVisibleAutofillControls().map((field) => ({
    element: field,
    value: field.value,
    checked: field instanceof HTMLInputElement ? field.checked : null,
  }))
  const hiddenFormationStatus = pathname.includes("onboarding")
    ? (document.querySelector('input[name="formationStatus"]') as HTMLInputElement | null)
    : null

  if (hiddenFormationStatus) {
    controls.push({
      element: hiddenFormationStatus,
      value: hiddenFormationStatus.value,
      checked: hiddenFormationStatus.checked,
    })
  }

  const editors = Array.from(
    document.querySelectorAll<HTMLElement>(
      '[contenteditable="true"]:not([data-autofill-ignore="true"]):not([aria-hidden="true"])',
    ),
  )
    .filter((node) => isVisible(node))
    .map((editor) => ({
      element: editor,
      html: editor.innerHTML,
    }))

  return { pathname, controls, editors }
}

export function restoreAutofillSnapshot(snapshot: AutofillSnapshot): number {
  let restored = 0

  for (const entry of snapshot.controls) {
    const field = entry.element
    if (!field.isConnected) continue

    if (field instanceof HTMLInputElement && (field.type === "checkbox" || field.type === "radio")) {
      if (field.checked !== Boolean(entry.checked)) {
        field.checked = Boolean(entry.checked)
        field.dispatchEvent(new Event("input", { bubbles: true }))
        field.dispatchEvent(new Event("change", { bubbles: true }))
        restored += 1
      }
      continue
    }

    if (field.value !== entry.value) {
      setFieldValue(field, entry.value)
      restored += 1
    }
  }

  for (const entry of snapshot.editors) {
    const editor = entry.element
    if (!editor.isConnected) continue
    if (editor.innerHTML === entry.html) continue
    editor.innerHTML = entry.html
    editor.dispatchEvent(new Event("input", { bubbles: true }))
    editor.dispatchEvent(new Event("change", { bubbles: true }))
    restored += 1
  }

  return restored
}
