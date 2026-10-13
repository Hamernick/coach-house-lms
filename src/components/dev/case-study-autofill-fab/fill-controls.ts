import { CASE_STUDY, LONG_TEXT_FALLBACK } from "./constants"
import {
  getVisibleAutofillControls,
  isVisible,
  normalize,
  setFieldValue,
} from "./dom-utils"
import type { AutofillReport } from "./types"
import { buildFieldHints, resolveTextValue } from "./value-resolution"

function fillFormationStatusIfNeeded(pathname: string) {
  if (!pathname.includes("onboarding")) return 0

  const hidden = document.querySelector('input[name="formationStatus"]') as HTMLInputElement | null
  if (!hidden || hidden.value) return 0

  const option = Array.from(document.querySelectorAll('button[role="radio"]')).find((button) =>
    /in progress/i.test(button.textContent ?? ""),
  ) as HTMLButtonElement | undefined

  if (!option) return 0
  option.click()
  return 1
}

function fillContentEditable(pathname: string) {
  const editors = Array.from(
    document.querySelectorAll<HTMLElement>(
      '[contenteditable="true"]:not([data-autofill-ignore="true"]):not([aria-hidden="true"])',
    ),
  ).filter((node) => isVisible(node) && !normalize(node.textContent))

  if (editors.length === 0) return 0

  const text = pathname.includes("/roadmap")
    ? CASE_STUDY.programSummary
    : pathname.includes("/module/")
      ? CASE_STUDY.originStory
      : LONG_TEXT_FALLBACK

  for (const editor of editors) {
    editor.focus()
    document.execCommand("selectAll", false)
    document.execCommand("insertText", false, text)
    editor.dispatchEvent(new Event("input", { bubbles: true }))
    editor.dispatchEvent(new Event("change", { bubbles: true }))
    editor.blur()
  }

  return editors.length
}

export function fillVisibleControls(pathname: string): AutofillReport {
  const controls = getVisibleAutofillControls()

  let touched = 0
  let changed = 0

  for (const field of controls) {
    touched += 1
    const hints = buildFieldHints(field)
    if (/people-search|people-category|search/.test(hints)) continue

    if (field instanceof HTMLInputElement && field.type === "checkbox") {
      if (!/newsletter|updates|opt.?in|agree|consent|terms/i.test(hints)) continue
      if (!field.checked) {
        field.click()
        changed += 1
      }
      continue
    }

    if (field instanceof HTMLInputElement && field.type === "radio") {
      if (!field.checked) {
        field.click()
        changed += 1
      }
      continue
    }

    if (field instanceof HTMLSelectElement) {
      const mappedValue = resolveTextValue(
        Object.assign(document.createElement("input"), {
          type: "text",
          getAttribute: (name: string) => {
            if (name === "name") return field.name
            if (name === "id") return field.id
            if (name === "aria-label") return field.getAttribute("aria-label")
            if (name === "placeholder") return field.getAttribute("placeholder")
            return null
          },
        }) as HTMLInputElement,
        pathname,
      )
      const targetValue = mappedValue
        ? Array.from(field.options).find((option) => {
            const optionText = normalize(option.textContent)
            const optionValue = normalize(option.value)
            const candidate = normalize(mappedValue)
            return optionText.includes(candidate) || optionValue.includes(candidate)
          })?.value
        : undefined

      const fallbackValue =
        targetValue ??
        Array.from(field.options).find((option) => normalize(option.value) && normalize(option.textContent))?.value

      if (
        fallbackValue &&
        field.value !== fallbackValue &&
        !/all\s+modules|all\s+lessons/i.test(hints)
      ) {
        setFieldValue(field, fallbackValue)
        changed += 1
      }
      continue
    }

    const currentValue = normalize(field.value)
    if (currentValue.length > 0) continue

    const nextValue = resolveTextValue(field, pathname)
    if (!nextValue) continue

    setFieldValue(field, nextValue)
    changed += 1
  }

  changed += fillFormationStatusIfNeeded(pathname)
  changed += fillContentEditable(pathname)

  return { changed, touched }
}
