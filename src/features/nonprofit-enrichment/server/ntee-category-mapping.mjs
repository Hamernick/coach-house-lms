import reference from "./ntee-core-codes.json" with { type: "json" }

export const CATEGORY_MAPPING_VERSION = "irs-organization-topics-v1"
export const CATEGORY_REFERENCE = reference
const coreCodes = new Set(reference.codes)

// These four keys are the approved navigation proposal. Public registry/UI
// integration is a later release; this offline mapper never publishes them.
export const CATEGORY_NAVIGATION_ADDITIONS = {
  arts: { label: "Arts & Culture", existingLeaves: ["community_arts_culture"] },
  faith: {
    label: "Faith & Religion",
    existingLeaves: ["community_faith_organizations"],
  },
  recreation: {
    label: "Sports & Recreation",
    existingLeaves: ["community_sports", "community_recreation"],
  },
  philanthropy: { label: "Philanthropy & Grantmaking", existingLeaves: [] },
}

// Organization topics only. Never emit service leaves from an IRS code.
export const NTEE_MAJOR_TOPICS = {
  A: ["arts"],
  B: ["education"],
  C: ["environment"],
  D: ["animals"],
  E: ["health"],
  F: ["health"],
  G: ["health"],
  H: ["health"],
  I: ["legal"],
  J: ["employment"],
  K: ["food"],
  L: ["housing"],
  M: ["emergency", "safety"],
  N: ["recreation"],
  O: ["family"],
  P: ["community"],
  Q: ["international"],
  R: ["legal"],
  S: ["community"],
  T: ["philanthropy"],
  W: ["community"],
  X: ["faith"],
}

// Checked against the retained IRS core-code reference. Only explicit topics
// are added; no current availability, eligibility or physical locations inferred.
export const NTEE_TOPIC_OVERRIDES = {
  I20: ["safety"],
  I21: ["safety", "family"],
  I23: ["safety"],
  I60: ["safety"],
  I70: ["safety"],
  I71: ["safety", "family"],
  I72: ["safety", "family"],
  I73: ["safety"],
  K20: ["food", "environment"],
  K25: ["environment"],
  M20: ["emergency"],
  M23: ["emergency", "safety"],
  M24: ["safety"],
  M40: ["safety"],
  M41: ["health", "safety"],
  M42: ["safety"],
  M60: ["safety"],
  P30: ["family"],
  P31: ["family"],
  P32: ["family"],
  P33: ["family"],
  P40: ["family"],
  P42: ["family"],
  P43: ["family", "housing", "safety"],
  P45: ["family"],
  P46: ["family"],
  P47: ["family", "health"],
  P51: ["finance"],
  P60: ["emergency"],
  P62: ["safety"],
  P74: ["health"],
  P75: ["housing"],
  P82: ["health"],
  P85: ["housing"],
  P86: ["health"],
  P87: ["health"],
  S50: ["organizations"],
  W22: ["finance"],
  W60: ["finance"],
  W61: ["finance"],
}

export function mapNteeCategory(rawCode) {
  const code = typeof rawCode === "string" ? rawCode.trim().toUpperCase() : ""
  const result = {
    rawCode: rawCode ?? null,
    normalizedCode: code || null,
    coreCode: null,
    categories: [],
    state: "unclassified",
    reason: "missing_ntee",
    basis: "irs_classification",
    scope: "organization_topic",
    mappingVersion: CATEGORY_MAPPING_VERSION,
    provesServices: false,
  }
  if (!code) return result
  if (!/^[A-Z][0-9][0-9A-Z][0-9A-Z]?$/.test(code))
    return { ...result, reason: "malformed_ntee" }
  const coreCode = code.slice(0, 3)
  if (!coreCodes.has(coreCode))
    return { ...result, coreCode, reason: "unrecognized_core_code" }
  if (code[0] === "Z") return { ...result, coreCode, reason: "irs_unknown" }
  // Science/social-science and mutual-benefit organizations do not equate to
  // educational services or nonprofit operational support. Leave a visible gap.
  const categories =
    NTEE_TOPIC_OVERRIDES[coreCode] ?? NTEE_MAJOR_TOPICS[code[0]]
  if (!categories) return { ...result, coreCode, reason: "no_equivalent_topic" }
  return {
    ...result,
    coreCode,
    categories: [...new Set(categories)].sort(),
    state: "mapped",
    reason: coreCode in NTEE_TOPIC_OVERRIDES ? "detailed_code" : "major_topic",
  }
}

export function mapOrganizationCategories(rawCodes) {
  const codes = [...new Set(rawCodes.map((code) => code ?? null))]
  const observations = codes.map(mapNteeCategory)
  const normalized = new Set(observations.map((o) => o.normalizedCode))
  // Preserve conflicting snapshots rather than choosing whichever CSV came first.
  if (normalized.size > 1)
    return {
      state: "unclassified",
      reason: "conflicting_source_codes",
      categories: [],
      observations,
    }
  const first = observations[0] ?? mapNteeCategory(null)
  return {
    state: first.state,
    reason: first.reason,
    categories: first.categories,
    observations,
  }
}
