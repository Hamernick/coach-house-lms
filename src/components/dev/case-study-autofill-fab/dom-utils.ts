import type { AutofillControl } from "./types"

export function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase()
}

export function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export function isVisible(element: HTMLElement) {
  const style = window.getComputedStyle(element)
  if (style.display === "none" || style.visibility === "hidden") return false
  const rect = element.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0
}

export function setFieldValue(field: AutofillControl, nextValue: string) {
  if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
    const setter = Object.getOwnPropertyDescriptor(field.constructor.prototype, "value")?.set
    if (setter) {
      setter.call(field, nextValue)
    } else {
      field.value = nextValue
    }
    field.dispatchEvent(new Event("input", { bubbles: true }))
    field.dispatchEvent(new Event("change", { bubbles: true }))
    return
  }

  field.value = nextValue
  field.dispatchEvent(new Event("input", { bubbles: true }))
  field.dispatchEvent(new Event("change", { bubbles: true }))
}

export function findVisibleButtonByText(scope: ParentNode, pattern: RegExp) {
  return (
    Array.from(scope.querySelectorAll<HTMLButtonElement>("button")).find((button) => {
      if (!isVisible(button)) return false
      const text = normalize(button.textContent)
      return pattern.test(text)
    }) ?? null
  )
}

export function getVisibleAutofillControls() {
  return Array.from(
    document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      "input, textarea, select",
    ),
  ).filter((field) => {
    if (field.disabled) return false
    if (
      field instanceof HTMLInputElement &&
      ["hidden", "file", "submit", "button", "reset", "image"].includes(field.type)
    ) {
      return false
    }
    if (
      (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) &&
      field.readOnly
    ) {
      return false
    }
    return isVisible(field)
  })
}
