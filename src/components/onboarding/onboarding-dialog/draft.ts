import { DRAFT_FLAG_KEYS, DRAFT_VALUE_KEYS } from "./constants"
import type {
  OnboardingDraft,
  OnboardingDraftFlags,
  OnboardingDraftValues,
} from "./types"

export const ONBOARDING_DRAFT_STORAGE_KEY = "onboardingDraftV2"

function parseOnboardingDraft(raw: string | null): OnboardingDraft | null {
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as OnboardingDraft
    return parsed && typeof parsed === "object" ? parsed : null
  } catch {
    return null
  }
}

export function readOnboardingDraft(): OnboardingDraft | null {
  if (typeof window === "undefined") return null
  return parseOnboardingDraft(
    window.localStorage.getItem(ONBOARDING_DRAFT_STORAGE_KEY),
  )
}

export function writeOnboardingDraft(draft: OnboardingDraft): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(ONBOARDING_DRAFT_STORAGE_KEY, JSON.stringify(draft))
}

export function clearOnboardingDraft(): void {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(ONBOARDING_DRAFT_STORAGE_KEY)
}

export function readDraftSnapshot(): {
  values: OnboardingDraftValues
  flags: OnboardingDraftFlags
} {
  const draft = readOnboardingDraft()
  const values =
    draft?.values && typeof draft.values === "object" ? draft.values : {}
  const flags = draft?.flags && typeof draft.flags === "object" ? draft.flags : {}

  return { values, flags }
}

export function collectDraftValues(
  form: HTMLFormElement,
  data: FormData,
  previousValues: OnboardingDraftValues,
): OnboardingDraftValues {
  const nextValues: OnboardingDraftValues = { ...previousValues }

  for (const key of DRAFT_VALUE_KEYS) {
    const field = form.querySelector(`[name="${key}"]`) as
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement
      | null
    if (field) {
      nextValues[key] = String(data.get(key) ?? "")
    }
  }

  return nextValues
}

export function collectDraftFlags(
  form: HTMLFormElement,
  previousFlags: OnboardingDraftFlags,
): OnboardingDraftFlags {
  const nextFlags = { ...previousFlags }

  for (const key of DRAFT_FLAG_KEYS) {
    const checked = readCheckboxFlag(form, key)
    if (checked !== undefined) {
      nextFlags[key] = checked
    }
  }

  return nextFlags
}

function readCheckboxFlag(
  form: HTMLFormElement,
  key: (typeof DRAFT_FLAG_KEYS)[number],
): boolean | undefined {
  const radixCheckbox = form.querySelector(
    `[data-slot="checkbox"]#${key}`,
  ) as HTMLElement | null
  if (radixCheckbox) {
    return radixCheckbox.getAttribute("data-state") === "checked"
  }

  const nativeCheckbox = form.querySelector(
    `input[name="${key}"][type="checkbox"]`,
  ) as HTMLInputElement | null
  if (nativeCheckbox) {
    return nativeCheckbox.checked
  }

  return undefined
}

function applyCheckboxFlag(
  form: HTMLFormElement,
  key: (typeof DRAFT_FLAG_KEYS)[number],
  checked: boolean,
): void {
  const radixCheckbox = form.querySelector(
    `[data-slot="checkbox"]#${key}`,
  ) as HTMLButtonElement | null
  if (radixCheckbox) {
    const currentlyChecked = radixCheckbox.getAttribute("data-state") === "checked"
    if (currentlyChecked !== checked) {
      radixCheckbox.click()
    }
    return
  }

  const nativeCheckbox = form.querySelector(
    `input[name="${key}"][type="checkbox"]`,
  ) as HTMLInputElement | null
  if (nativeCheckbox) {
    nativeCheckbox.checked = checked
  }
}

export function applyDraftValuesToForm(
  form: HTMLFormElement,
  values: OnboardingDraftValues | undefined,
  resolveDraftFieldValue: (key: string, draftValue: unknown) => string,
): void {
  if (!values) return

  for (const [key, value] of Object.entries(values)) {
    const el = form.querySelector(`[name="${key}"]`) as
      | HTMLInputElement
      | HTMLTextAreaElement
      | null
    if (!el) continue
    el.value = resolveDraftFieldValue(key, value)
  }
}

export function applyDraftFlagsToForm(
  form: HTMLFormElement,
  flags: OnboardingDraftFlags | undefined,
): void {
  if (!flags) return

  if (flags.optInUpdates !== undefined) {
    applyCheckboxFlag(form, "optInUpdates", Boolean(flags.optInUpdates))
  }

  if (flags.newsletterOptIn !== undefined) {
    applyCheckboxFlag(form, "newsletterOptIn", Boolean(flags.newsletterOptIn))
  }
}
