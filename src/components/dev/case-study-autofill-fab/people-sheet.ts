import { delay, findVisibleButtonByText, isVisible, normalize } from "./dom-utils"
import { fillVisibleControls } from "./fill-controls"
import type { AutofillReport } from "./types"

export async function ensurePeopleAddSheetOpen() {
  const existingSheet = document.querySelector<HTMLElement>('[data-slot="sheet-content"]')
  if (existingSheet && isVisible(existingSheet)) return existingSheet

  const trigger = document.querySelector<HTMLButtonElement>('button[data-tour="people-add"]')
  if (!trigger || !isVisible(trigger) || trigger.disabled) return null

  trigger.click()
  await delay(140)
  const openedSheet = document.querySelector<HTMLElement>('[data-slot="sheet-content"]')
  if (!openedSheet || !isVisible(openedSheet)) return null
  return openedSheet
}

export async function fillPeopleAddSheet(
  pathname: string,
  initialSheet?: HTMLElement | null,
): Promise<AutofillReport> {
  const sheet = initialSheet ?? (await ensurePeopleAddSheetOpen())
  if (!sheet) return { changed: 0, touched: 0 }

  let changed = 0
  let touched = 0

  for (let step = 0; step < 4; step += 1) {
    const report = fillVisibleControls(pathname)
    changed += report.changed
    touched += report.touched

    const currentSheet = document.querySelector<HTMLElement>('[data-slot="sheet-content"]')
    if (!currentSheet || !isVisible(currentSheet)) break

    const primary = findVisibleButtonByText(
      currentSheet,
      /^(continue|add person|save changes)$/i,
    )
    if (!primary || primary.disabled) break

    const label = normalize(primary.textContent)
    if (!label.includes("continue")) break

    primary.click()
    await delay(140)
  }

  return { changed, touched }
}
