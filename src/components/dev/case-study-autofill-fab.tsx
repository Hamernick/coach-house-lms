"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import SparklesIcon from "lucide-react/dist/esm/icons/sparkles"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { toast } from "@/lib/toast"

type AutofillReport = {
  changed: number
  touched: number
}

const QA_AUTOFILL_ALLOWED_EMAILS = new Set([
  "caleb.hamernick@gmail.com",
  "caleb@bandto.com",
])
const QA_AUTOFILL_TOKEN_KEY = "coachhouse.qaAutofillEnabled"
const QA_AUTOFILL_FIRST_USE_ACK_KEY = "coachhouse.qaAutofillFirstUseAcknowledged.v1"

type AutofillControl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

type AutofillControlSnapshot = {
  element: AutofillControl
  value: string
  checked: boolean | null
}

type AutofillEditorSnapshot = {
  element: HTMLElement
  html: string
}

type AutofillSnapshot = {
  pathname: string
  controls: AutofillControlSnapshot[]
  editors: AutofillEditorSnapshot[]
}

const CASE_STUDY = {
  orgName: "Bright Futures Collective",
  orgSlug: "bright-futures-collective",
  tagline: "Powering opportunity for youth",
  firstName: "Leslie",
  lastName: "Monroe",
  fullName: "Leslie Monroe",
  representative: "Jordan Lee",
  ein: "47-2198456",
  phone: "(415) 555-0139",
  accountEmail: "caleb.hamernick@gmail.com",
  publicEmail: "hello@brightfuturescollective.org",
  title: "Founder & Executive Director",
  programTitle: "Community Intake Lab",
  programSubtitle: "Direct Services · Oakland, CA",
  programStatus: "Planned",
  programType: "Direct Services",
  coreFormat: "Cohort",
  locationType: "In person",
  frequency: "Weekly",
  durationLabel: "16 weeks",
  startMonth: "2026-09",
  budgetUsd: "26000",
  peopleServed: "120",
  staffCount: "4",
  fundingGoalUsd: "40000",
  linkedin: "https://www.linkedin.com/in/leslie-monroe-nfp",
  website: "brightfuturescollective.org",
  newsletter: "newsletter.brightfuturescollective.org",
  twitter: "https://x.com/brightfuturesco",
  facebook: "https://facebook.com/brightfuturescollective",
  instagram: "https://instagram.com/brightfuturescollective",
  youtube: "https://youtube.com/@brightfuturescollective",
  tiktok: "https://tiktok.com/@brightfuturescollective",
  github: "https://github.com/brightfuturescollective",
  mission:
    "Bright Futures Collective equips first-generation young adults with mental wellness support, life-skills coaching, and paid career pathways.",
  vision:
    "A future where every young adult transitioning out of instability has community, confidence, and a sustainable path to thrive.",
  values:
    "Dignity first, community-led design, measurable outcomes, and transparent stewardship of funds.",
  need:
    "In Alameda County, opportunity youth face long waitlists for support services and low access to paid pathways, creating compounding housing and employment instability.",
  theoryOfChange:
    "If we provide trauma-informed coaching, practical skill-building, and paid placement pathways, then participants increase stability, completion, and long-term income outcomes.",
  originStory:
    "After years of mentoring youth navigating housing and school disruption, our team saw the same pattern: talent was present, but systems were fragmented. Bright Futures Collective formed to create one coordinated pathway from crisis to stability to employment.",
  programSummary:
    "Our flagship program pairs weekly coaching, employer-partner workshops, and paid apprenticeship placements over 16 weeks.",
  budgetNarrative:
    "Year one budget prioritizes direct-service staffing, participant stipends, and evaluation capacity, with overhead held below 15 percent.",
  city: "Oakland",
  state: "CA",
  country: "United States",
  addressLine1: "1450 Franklin St",
  addressLine2: "Suite 520",
  postalCode: "94612",
  boilerplate:
    "Bright Futures Collective is an Oakland-based nonprofit that helps first-generation young adults build stability through trauma-informed coaching, paid career pathways, and community-rooted support.",
  organizationBio:
    "Bright Futures Collective is a nonprofit workforce and wellness initiative supporting transition-age youth through coaching, paid pathways, and community partnerships.",
}

const LONG_TEXT_FALLBACK =
  CASE_STUDY.boilerplate

function resolveValueByFieldName(field: HTMLInputElement | HTMLTextAreaElement) {
  const name = normalize(field.getAttribute("name"))
  const id = normalize(field.getAttribute("id"))
  const key = name || id
  if (!key) return undefined

  switch (key) {
    case "orgname":
    case "organizationname":
    case "companyname":
      return CASE_STUDY.orgName
    case "name":
      return CASE_STUDY.orgName
    case "tagline":
      return CASE_STUDY.tagline
    case "rep":
      return CASE_STUDY.representative
    case "ein":
      return CASE_STUDY.ein
    case "publicurl":
      return CASE_STUDY.website
    case "newsletter":
      return CASE_STUDY.newsletter
    case "twitter":
      return CASE_STUDY.twitter
    case "facebook":
      return CASE_STUDY.facebook
    case "linkedin":
      return CASE_STUDY.linkedin
    case "instagram":
      return CASE_STUDY.instagram
    case "youtube":
      return CASE_STUDY.youtube
    case "tiktok":
      return CASE_STUDY.tiktok
    case "github":
      return CASE_STUDY.github
    case "boilerplate":
      return CASE_STUDY.boilerplate
    case "addressstreet":
      return CASE_STUDY.addressLine1
    case "addresscity":
      return CASE_STUDY.city
    case "addressstate":
      return CASE_STUDY.state
    case "addresspostal":
      return CASE_STUDY.postalCode
    case "addresscountry":
      return CASE_STUDY.country
    case "vision":
      return CASE_STUDY.vision
    case "mission":
      return CASE_STUDY.mission
    case "need":
      return CASE_STUDY.need
    case "values":
      return CASE_STUDY.values
    case "description":
      return CASE_STUDY.organizationBio
    case "programs":
      return CASE_STUDY.programSummary
    case "reports":
      return CASE_STUDY.budgetNarrative
    default:
      return undefined
  }
}

const FIELD_MATCHERS: Array<{ patterns: RegExp[]; value: keyof typeof CASE_STUDY | "password" | "longText" }> = [
  { patterns: [/\borg(?:anization)?\s*name\b|\bworkspace\s*name\b|\bcompany\s*name\b/i], value: "orgName" },
  { patterns: [/\bprogram\s*title\b|\burban greening fellowship\b/i], value: "programTitle" },
  { patterns: [/\btag\s*-?\s*line\b|\btagline\b/i], value: "tagline" },
  { patterns: [/\bsubtitle\b|\bcoaching\s*[·-]\s*chicago\b/i], value: "programSubtitle" },
  { patterns: [/\b(org|organization)\s*slug\b|\bpublic\s*url\b|\borganization\s*url\b|\bslug\b/i], value: "orgSlug" },
  { patterns: [/\bfirst\s*name\b|\bgiven\s*name\b/i], value: "firstName" },
  { patterns: [/\blast\s*name\b|\bfamily\s*name\b|\bsurname\b/i], value: "lastName" },
  { patterns: [/\bfull\s*name\b|\bdisplay\s*name\b|\bname\b/i], value: "fullName" },
  { patterns: [/\bpublic\s*email\b|\bcontact\s*email\b/i], value: "publicEmail" },
  { patterns: [/\baccount\s*email\b|\blogin\s*email\b|\bemail\b/i], value: "accountEmail" },
  { patterns: [/\bphone\b|\bmobile\b|\bcell\b/i], value: "phone" },
  { patterns: [/\btitle\b|\brole\b|\bposition\b|\bjob\b/i], value: "title" },
  { patterns: [/linkedin/i], value: "linkedin" },
  { patterns: [/\bwebsite\b|\bhomepage\b|\bdomain\b|\bpublic\s*site\b/i], value: "website" },
  { patterns: [/\bstatus\b/i], value: "programStatus" },
  { patterns: [/\bprogram\s*type\b/i], value: "programType" },
  { patterns: [/\bcore\s*format\b|\bdelivery\s*format\b/i], value: "coreFormat" },
  { patterns: [/\blocation\s*type\b/i], value: "locationType" },
  { patterns: [/\bfrequency\b/i], value: "frequency" },
  { patterns: [/\bduration\b/i], value: "durationLabel" },
  { patterns: [/\bstart\s*month\b/i], value: "startMonth" },
  { patterns: [/\bmission\b/i], value: "mission" },
  { patterns: [/\bvision\b/i], value: "vision" },
  { patterns: [/\bvalues?\b|\bprinciples\b/i], value: "values" },
  { patterns: [/\bneed\b|\bproblem\b|\bchallenge\b/i], value: "need" },
  { patterns: [/\borigin\b|\bstory\b|\bbackground\b|\bwhy\b/i], value: "originStory" },
  { patterns: [/\btheory\b|\blogic\s*model\b|\bif\s*then\b/i], value: "theoryOfChange" },
  { patterns: [/\bprogram\b|\bservice\b|\boffering\b/i], value: "programSummary" },
  { patterns: [/\bbudget\b|\bfinancial\b/i], value: "budgetNarrative" },
  { patterns: [/\bcity\b|\btown\b/i], value: "city" },
  { patterns: [/\bstate\b|\bprovince\b|\bregion\b/i], value: "state" },
  { patterns: [/\bcountry\b|\bnation\b/i], value: "country" },
  { patterns: [/\baddress\s*line\s*1\b|\bstreet\b|\baddress\b/i], value: "addressLine1" },
  { patterns: [/\baddress\s*line\s*2\b|\bsuite\b|\bunit\b|\bapt\b/i], value: "addressLine2" },
  { patterns: [/\bzip\b|\bpostal\b/i], value: "postalCode" },
  { patterns: [/\bbio\b|\bsummary\b|\bdescription\b|\babout\b/i], value: "organizationBio" },
  { patterns: [/\bpassword\b/i], value: "password" },
]

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase()
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function isVisible(element: HTMLElement) {
  const style = window.getComputedStyle(element)
  if (style.display === "none" || style.visibility === "hidden") return false
  const rect = element.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0
}

function buildFieldHints(field: HTMLElement) {
  const hints: string[] = []
  const name = normalize(field.getAttribute("name"))
  const id = normalize(field.getAttribute("id"))
  const placeholder = normalize(field.getAttribute("placeholder"))
  const ariaLabel = normalize(field.getAttribute("aria-label"))
  const autocomplete = normalize(field.getAttribute("autocomplete"))

  if (name) hints.push(name)
  if (id) hints.push(id)
  if (placeholder) hints.push(placeholder)
  if (ariaLabel) hints.push(ariaLabel)
  if (autocomplete) hints.push(autocomplete)

  if (id) {
    const label = document.querySelector(`label[for="${id}"]`)
    const labelText = normalize(label?.textContent)
    if (labelText) hints.push(labelText)
  }

  // Only fall back to fieldset legend when the input itself has no direct hints.
  if (hints.length === 0) {
    const fieldset = field.closest("fieldset")
    if (fieldset) {
      const legendText = normalize(fieldset.querySelector("legend")?.textContent)
      if (legendText) hints.push(legendText)
    }
  }

  return hints.join(" ")
}

function resolveTextValue(field: HTMLInputElement | HTMLTextAreaElement, pathname: string) {
  const directMatch = resolveValueByFieldName(field)
  if (directMatch) return directMatch

  const hints = buildFieldHints(field)
  const inputType = field instanceof HTMLInputElement ? normalize(field.type) : "textarea"
  const isMediaField = /image|logo|avatar|photo|picture|banner|cover|thumbnail|icon/.test(hints)

  if (isMediaField) {
    return undefined
  }

  if (pathname === "/onboarding" && /account.?email|login.?email/.test(hints)) {
    return undefined
  }

  if (inputType === "password") {
    return "Friday1223!"
  }

  if (inputType === "email" && /public|contact/.test(hints)) {
    return CASE_STUDY.publicEmail
  }

  if (inputType === "email") {
    return CASE_STUDY.accountEmail
  }

  if (inputType === "tel") {
    return CASE_STUDY.phone
  }

  if (inputType === "url") {
    if (/linkedin/.test(hints)) return CASE_STUDY.linkedin
    if (/twitter|x\.com/.test(hints)) return CASE_STUDY.twitter
    if (/facebook/.test(hints)) return CASE_STUDY.facebook
    if (/instagram/.test(hints)) return CASE_STUDY.instagram
    if (/youtube/.test(hints)) return CASE_STUDY.youtube
    if (/tiktok/.test(hints)) return CASE_STUDY.tiktok
    if (/github/.test(hints)) return CASE_STUDY.github
    if (/newsletter/.test(hints)) return CASE_STUDY.newsletter
    if (/website|homepage|domain|public.?site/.test(hints)) return CASE_STUDY.website
    return undefined
  }

  if (inputType === "month") {
    return CASE_STUDY.startMonth
  }

  if (inputType === "date") {
    return `${CASE_STUDY.startMonth}-01`
  }

  if (inputType === "number") {
    if (/budget|cost|usd|amount/i.test(hints)) return CASE_STUDY.budgetUsd
    if (/people served|participants?|cohort size/i.test(hints)) return CASE_STUDY.peopleServed
    if (/staff|team|fte/i.test(hints)) return CASE_STUDY.staffCount
    if (/goal|target|funding/i.test(hints)) return CASE_STUDY.fundingGoalUsd
    return "1"
  }

  for (const matcher of FIELD_MATCHERS) {
    if (matcher.patterns.some((pattern) => pattern.test(hints))) {
      if (matcher.value === "password") return "Friday1223!"
      if (matcher.value === "longText") return LONG_TEXT_FALLBACK
      return CASE_STUDY[matcher.value]
    }
  }

  if (field instanceof HTMLTextAreaElement) {
    return LONG_TEXT_FALLBACK
  }

  return undefined
}

function setFieldValue(field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, nextValue: string) {
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

function findVisibleButtonByText(scope: ParentNode, pattern: RegExp) {
  return (
    Array.from(scope.querySelectorAll<HTMLButtonElement>("button")).find((button) => {
      if (!isVisible(button)) return false
      const text = normalize(button.textContent)
      return pattern.test(text)
    }) ?? null
  )
}

function getVisibleAutofillControls() {
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
    if ((field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) && field.readOnly) {
      return false
    }
    return isVisible(field)
  })
}

function captureAutofillSnapshot(pathname: string): AutofillSnapshot {
  const controls = getVisibleAutofillControls().map((field) => ({
    element: field,
    value: field.value,
    checked: field instanceof HTMLInputElement ? field.checked : null,
  }))
  const hiddenFormationStatus =
    pathname.includes("onboarding")
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

function restoreAutofillSnapshot(snapshot: AutofillSnapshot): number {
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

function fillVisibleControls(pathname: string): AutofillReport {
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

      if (fallbackValue && field.value !== fallbackValue && !/all\s+modules|all\s+lessons/i.test(hints)) {
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

async function ensurePeopleAddSheetOpen() {
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

async function fillPeopleAddSheet(pathname: string, initialSheet?: HTMLElement | null): Promise<AutofillReport> {
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

    const primary = findVisibleButtonByText(currentSheet, /^(continue|add person|save changes)$/i)
    if (!primary || primary.disabled) break

    const label = normalize(primary.textContent)
    if (!label.includes("continue")) break

    primary.click()
    await delay(140)
  }

  return { changed, touched }
}

export function CaseStudyAutofillFab({
  userEmail,
  allowToken = false,
  className,
}: {
  userEmail?: string | null
  allowToken?: boolean
  className?: string
}) {
  const pathname = usePathname()
  const [pending, setPending] = useState(false)
  const [tokenAllowed, setTokenAllowed] = useState(false)
  const [localDevAllowed, setLocalDevAllowed] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [firstUseAcknowledged, setFirstUseAcknowledged] = useState(false)
  const undoSnapshotRef = useRef<AutofillSnapshot | null>(null)

  const allowedByEmail = useMemo(() => {
    const email = normalize(userEmail)
    if (!email) return false
    return QA_AUTOFILL_ALLOWED_EMAILS.has(email)
  }, [userEmail])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (allowedByEmail) {
      window.localStorage.setItem(QA_AUTOFILL_TOKEN_KEY, "1")
      setTokenAllowed(true)
      return
    }
    if (!allowToken) {
      setTokenAllowed(false)
      return
    }
    setTokenAllowed(window.localStorage.getItem(QA_AUTOFILL_TOKEN_KEY) === "1")
  }, [allowToken, allowedByEmail])

  useEffect(() => {
    if (typeof window === "undefined") return
    const host = window.location.hostname.toLowerCase()
    const isLocalHost = host === "localhost" || host === "127.0.0.1"
    setLocalDevAllowed(Boolean(userEmail) && isLocalHost)
  }, [userEmail])

  useEffect(() => {
    if (typeof window === "undefined") return
    setFirstUseAcknowledged(window.localStorage.getItem(QA_AUTOFILL_FIRST_USE_ACK_KEY) === "1")
  }, [])

  useEffect(() => {
    undoSnapshotRef.current = null
  }, [pathname])

  const allowed = localDevAllowed || allowedByEmail || (allowToken && tokenAllowed)

  const runAutofill = useCallback(() => {
    if (pending) return
    setPending(true)

    window.requestAnimationFrame(() => {
      void (async () => {
        try {
          let snapshot = captureAutofillSnapshot(pathname)
          let report = fillVisibleControls(pathname)
          const isPeoplePage = pathname.startsWith("/people")

          if (isPeoplePage && report.changed === 0) {
            const peopleSheet = await ensurePeopleAddSheetOpen()
            if (peopleSheet) {
              snapshot = captureAutofillSnapshot(pathname)
              const peopleReport = await fillPeopleAddSheet(pathname, peopleSheet)
              report = {
                changed: report.changed + peopleReport.changed,
                touched: report.touched + peopleReport.touched,
              }
            }
          }

          if (report.changed > 0) {
            undoSnapshotRef.current = snapshot
            toast.success(`Autofilled ${report.changed} fields for this page.`, {
              description: isPeoplePage
                ? "Review the person details, then click Add Person to save."
                : "Testing helper only. Use Undo if this was accidental.",
              action: {
                label: "Undo",
                onClick: () => {
                  const restored = restoreAutofillSnapshot(snapshot)
                  if (undoSnapshotRef.current === snapshot) {
                    undoSnapshotRef.current = null
                  }
                  if (restored > 0) {
                    toast.success(`Autofill undone (${restored} field${restored === 1 ? "" : "s"} restored).`)
                  } else {
                    toast.info("Nothing changed to undo on this page.")
                  }
                },
              },
            })
          } else {
            toast.info("No empty visible fields to autofill on this page.")
          }
        } catch {
          toast.error("Unable to autofill this page right now.")
        } finally {
          setPending(false)
        }
      })()
    })
  }, [pathname, pending])

  const handleAutofillClick = useCallback(() => {
    if (pending) return
    if (!firstUseAcknowledged) {
      setConfirmOpen(true)
      return
    }
    runAutofill()
  }, [firstUseAcknowledged, pending, runAutofill])

  const handleConfirmAutofill = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(QA_AUTOFILL_FIRST_USE_ACK_KEY, "1")
    }
    setFirstUseAcknowledged(true)
    setConfirmOpen(false)
    runAutofill()
  }, [runAutofill])

  if (!allowed) return null

  return (
    <div
      className={cn(
        "pointer-events-none fixed right-4 z-[70] flex",
        "bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:bottom-4",
        className,
      )}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="pointer-events-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full border-border/80 bg-background/95 text-foreground shadow-sm backdrop-blur"
              onClick={handleAutofillClick}
              disabled={pending}
            >
              <SparklesIcon className="h-4 w-4" aria-hidden />
              {pending ? "Filling..." : "Autofill page"}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent side="left" sideOffset={8} className="max-w-[260px] leading-relaxed">
          Fills visible empty fields with QA demo data. First click shows details, and each fill can be undone.
        </TooltipContent>
      </Tooltip>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Use Autofill page for testing?</AlertDialogTitle>
            <AlertDialogDescription>
              This tester tool fills visible empty inputs with sample data on this page so QA can move quickly.
              It may trigger form state changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <p className="rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            Use only in testing. If clicked by mistake, use the Undo action shown immediately after autofill.
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAutofill} disabled={pending}>
              {pending ? "Filling..." : "Autofill page"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
