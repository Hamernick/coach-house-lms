"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname } from "next/navigation"
import SparklesIcon from "lucide-react/dist/esm/icons/sparkles"

import { Button } from "@/components/ui/button"
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

const CASE_STUDY = {
  orgName: "Bright Futures Collective",
  orgSlug: "bright-futures-collective",
  firstName: "Leslie",
  lastName: "Monroe",
  fullName: "Leslie Monroe",
  phone: "(415) 555-0139",
  accountEmail: "caleb.hamernick@gmail.com",
  publicEmail: "hello@brightfuturescollective.org",
  title: "Founder & Executive Director",
  linkedin: "https://www.linkedin.com/in/leslie-monroe-nfp",
  website: "https://www.brightfuturescollective.org",
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
  organizationBio:
    "Bright Futures Collective is a nonprofit workforce and wellness initiative supporting transition-age youth through coaching, paid pathways, and community partnerships.",
}

const LONG_TEXT_FALLBACK =
  "Draft placeholder content for QA walkthrough. Replace this text during final review."

const FIELD_MATCHERS: Array<{ patterns: RegExp[]; value: keyof typeof CASE_STUDY | "password" | "longText" }> = [
  { patterns: [/org.?name|organization.?name|workspace.?name|company.?name/i], value: "orgName" },
  { patterns: [/org.?slug|public.?url|organization.?url|slug/i], value: "orgSlug" },
  { patterns: [/first.?name|given.?name/i], value: "firstName" },
  { patterns: [/last.?name|family.?name|surname/i], value: "lastName" },
  { patterns: [/full.?name|display.?name|name/i], value: "fullName" },
  { patterns: [/public.?email|contact.?email/i], value: "publicEmail" },
  { patterns: [/account.?email|login.?email|email/i], value: "accountEmail" },
  { patterns: [/phone|mobile|cell/i], value: "phone" },
  { patterns: [/title|role|position|job/i], value: "title" },
  { patterns: [/linkedin/i], value: "linkedin" },
  { patterns: [/website|homepage|domain|public.?site/i], value: "website" },
  { patterns: [/mission/i], value: "mission" },
  { patterns: [/vision/i], value: "vision" },
  { patterns: [/values?|principles/i], value: "values" },
  { patterns: [/need|problem|challenge/i], value: "need" },
  { patterns: [/origin|story|background|why/i], value: "originStory" },
  { patterns: [/theory|logic.?model|if.?then/i], value: "theoryOfChange" },
  { patterns: [/program|service|offering/i], value: "programSummary" },
  { patterns: [/budget|financial/i], value: "budgetNarrative" },
  { patterns: [/city|town/i], value: "city" },
  { patterns: [/state|province|region/i], value: "state" },
  { patterns: [/country|nation/i], value: "country" },
  { patterns: [/address.?line.?1|street|address/i], value: "addressLine1" },
  { patterns: [/address.?line.?2|suite|unit|apt/i], value: "addressLine2" },
  { patterns: [/zip|postal/i], value: "postalCode" },
  { patterns: [/bio|summary|description|about/i], value: "organizationBio" },
  { patterns: [/password/i], value: "password" },
]

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase()
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

  const fieldset = field.closest("fieldset")
  if (fieldset) {
    const legendText = normalize(fieldset.querySelector("legend")?.textContent)
    if (legendText) hints.push(legendText)
  }

  return hints.join(" ")
}

function resolveTextValue(field: HTMLInputElement | HTMLTextAreaElement, pathname: string) {
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
    if (/website|homepage|domain|public.?site/.test(hints)) return CASE_STUDY.website
    return undefined
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
  const controls = Array.from(
    document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      "input, textarea, select",
    ),
  ).filter((field) => {
    if (field.disabled) return false
    if (field instanceof HTMLInputElement && ["hidden", "file", "submit", "button", "reset", "image"].includes(field.type))
      return false
    if ((field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) && field.readOnly) return false
    return isVisible(field)
  })

  let touched = 0
  let changed = 0

  for (const field of controls) {
    touched += 1

    if (field instanceof HTMLInputElement && field.type === "checkbox") {
      const hints = buildFieldHints(field)
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
      const hints = buildFieldHints(field)
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

  const allowed = localDevAllowed || allowedByEmail || (allowToken && tokenAllowed)

  const handleAutofill = useCallback(() => {
    if (pending) return
    setPending(true)

    window.requestAnimationFrame(() => {
      try {
        const report = fillVisibleControls(pathname)
        if (report.changed > 0) {
          toast.success(`Autofilled ${report.changed} fields for this page.`)
        } else {
          toast.info("No empty visible fields to autofill on this page.")
        }
      } catch {
        toast.error("Unable to autofill this page right now.")
      } finally {
        setPending(false)
      }
    })
  }, [pathname, pending])

  if (!allowed) return null

  return (
    <div
      className={cn(
        "pointer-events-none fixed right-4 z-40 flex",
        "bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:bottom-4",
        className,
      )}
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="pointer-events-auto rounded-full border-border/80 bg-background/95 text-foreground shadow-sm backdrop-blur"
        onClick={handleAutofill}
        disabled={pending}
      >
        <SparklesIcon className="h-4 w-4" aria-hidden />
        {pending ? "Filling..." : "Autofill page"}
      </Button>
    </div>
  )
}
