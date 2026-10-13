import { CASE_STUDY, LONG_TEXT_FALLBACK } from "./constants"
import { normalize } from "./dom-utils"

type MatcherValue = keyof typeof CASE_STUDY | "password" | "longText"

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

const FIELD_MATCHERS: Array<{
  patterns: RegExp[]
  value: MatcherValue
}> = [
  {
    patterns: [
      /\borg(?:anization)?\s*name\b|\bworkspace\s*name\b|\bcompany\s*name\b/i,
    ],
    value: "orgName",
  },
  {
    patterns: [/\bprogram\s*title\b|\burban greening fellowship\b/i],
    value: "programTitle",
  },
  { patterns: [/\btag\s*-?\s*line\b|\btagline\b/i], value: "tagline" },
  {
    patterns: [/\bsubtitle\b|\bcoaching\s*[·-]\s*chicago\b/i],
    value: "programSubtitle",
  },
  {
    patterns: [
      /\b(org|organization)\s*slug\b|\bpublic\s*url\b|\borganization\s*url\b|\bslug\b/i,
    ],
    value: "orgSlug",
  },
  { patterns: [/\bfirst\s*name\b|\bgiven\s*name\b/i], value: "firstName" },
  {
    patterns: [/\blast\s*name\b|\bfamily\s*name\b|\bsurname\b/i],
    value: "lastName",
  },
  { patterns: [/\bfull\s*name\b|\bdisplay\s*name\b|\bname\b/i], value: "fullName" },
  { patterns: [/\bpublic\s*email\b|\bcontact\s*email\b/i], value: "publicEmail" },
  { patterns: [/\baccount\s*email\b|\blogin\s*email\b|\bemail\b/i], value: "accountEmail" },
  { patterns: [/\bphone\b|\bmobile\b|\bcell\b/i], value: "phone" },
  { patterns: [/\btitle\b|\brole\b|\bposition\b|\bjob\b/i], value: "title" },
  { patterns: [/linkedin/i], value: "linkedin" },
  {
    patterns: [/\bwebsite\b|\bhomepage\b|\bdomain\b|\bpublic\s*site\b/i],
    value: "website",
  },
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

export function buildFieldHints(field: HTMLElement) {
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

  if (hints.length === 0) {
    const fieldset = field.closest("fieldset")
    if (fieldset) {
      const legendText = normalize(fieldset.querySelector("legend")?.textContent)
      if (legendText) hints.push(legendText)
    }
  }

  return hints.join(" ")
}

export function resolveTextValue(
  field: HTMLInputElement | HTMLTextAreaElement,
  pathname: string,
) {
  const directMatch = resolveValueByFieldName(field)
  if (directMatch) return directMatch

  const hints = buildFieldHints(field)
  const inputType = field instanceof HTMLInputElement ? normalize(field.type) : "textarea"
  const isMediaField = /image|logo|avatar|photo|picture|banner|cover|thumbnail|icon/.test(
    hints,
  )

  if (isMediaField) return undefined

  if (pathname === "/onboarding" && /account.?email|login.?email/.test(hints)) {
    return undefined
  }

  if (inputType === "password") return "Friday1223!"

  if (inputType === "email" && /public|contact/.test(hints)) {
    return CASE_STUDY.publicEmail
  }

  if (inputType === "email") return CASE_STUDY.accountEmail
  if (inputType === "tel") return CASE_STUDY.phone

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

  if (inputType === "month") return CASE_STUDY.startMonth
  if (inputType === "date") return `${CASE_STUDY.startMonth}-01`

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
