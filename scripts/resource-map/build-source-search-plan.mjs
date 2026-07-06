#!/usr/bin/env node
import { writeFileSync } from "node:fs"

const CATEGORY_CONFIG = {
  food: {
    label: "Food",
    terms: ["food pantry", "meal program", "grocery assistance"],
    officialTerms: ["food access", "nutrition assistance"],
  },
  housing: {
    label: "Housing",
    terms: ["shelter", "homeless services", "warming center"],
    officialTerms: ["housing services", "homeless services"],
  },
  education: {
    label: "Education",
    terms: ["adult education", "tutoring", "education resources"],
    officialTerms: ["adult education", "family learning"],
  },
  employment: {
    label: "Employment",
    terms: ["job training", "workforce services", "employment assistance"],
    officialTerms: ["workforce development", "career center"],
  },
  finance: {
    label: "Finance",
    terms: ["cash assistance", "benefits enrollment", "financial coaching"],
    officialTerms: ["public benefits", "financial assistance"],
  },
  legal: {
    label: "Legal",
    terms: ["legal aid", "immigration help", "rights assistance"],
    officialTerms: ["legal aid", "civil legal services"],
  },
  family: {
    label: "Family",
    terms: ["childcare assistance", "parenting support", "youth services"],
    officialTerms: ["family support services", "childcare resources"],
  },
  community: {
    label: "Community",
    terms: ["community resources", "resource directory", "mutual aid"],
    officialTerms: ["community services", "resource directory"],
  },
  emergency: {
    label: "Crisis support",
    terms: ["emergency assistance", "crisis response", "disaster relief"],
    officialTerms: ["emergency management", "crisis services"],
  },
  environment: {
    label: "Environment",
    terms: ["climate resilience", "environmental justice", "conservation"],
    officialTerms: ["environmental services", "sustainability"],
  },
  health: {
    label: "Health",
    terms: ["free clinic", "community clinic", "primary care"],
    officialTerms: ["public health clinic", "community health center"],
  },
  safety: {
    label: "Safety",
    terms: ["violence prevention", "street outreach", "survivor support"],
    officialTerms: ["public safety", "violence prevention"],
  },
  organizations: {
    label: "Organizations",
    terms: ["fiscal sponsorship", "capacity building", "technical assistance"],
    officialTerms: ["nonprofit support", "capacity building"],
  },
  international: {
    label: "International",
    terms: ["refugee services", "asylum support", "humanitarian aid"],
    officialTerms: ["refugee services", "immigrant services"],
  },
  animals: {
    label: "Animals",
    terms: ["pet food assistance", "animal welfare", "veterinary assistance"],
    officialTerms: ["animal services", "pet assistance"],
  },
}

const SEARCH_INTENTS = [
  {
    key: "official_open_data",
    trustLevel: "official",
    sourceType: "csv",
    query({ location, term }) {
      return `site:.gov "${location}" "${term}" "open data"`
    },
  },
  {
    key: "official_directory",
    trustLevel: "official",
    sourceType: "scrape",
    query({ location, officialTerm }) {
      return `site:.gov "${location}" "${officialTerm}" "resource directory"`
    },
  },
  {
    key: "211_referral",
    trustLevel: "partner",
    sourceType: "partner",
    query({ location, term }) {
      return `"${location}" "211" "${term}" "resources"`
    },
  },
  {
    key: "provider_service_page",
    trustLevel: "community",
    sourceType: "manual",
    query({ location, term }) {
      return `"${location}" "${term}" "eligibility" "intake"`
    },
  },
]

const REQUIRED_CHECKS = [
  "Confirm source owner and jurisdiction.",
  "Confirm terms/license allow storage, transformation, and public display.",
  "Capture attribution requirements.",
  "Capture sample source URL and observed timestamp.",
  "Do not import private contact/link data as public.",
  "Leave manualConfirmationRequired true until a super-admin approves the source.",
]

function parseArgs(argv) {
  const args = {
    categories: [],
    format: "json",
    locations: [],
    output: null,
    pretty: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (!arg.startsWith("--")) continue
    const key = arg.slice(2)
    const next = argv[index + 1]
    const value = !next || next.startsWith("--") ? true : next
    if (value !== true) index += 1

    if (key === "category" || key === "categories") {
      args.categories.push(
        ...String(value)
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean)
      )
    } else if (key === "location" || key === "locations") {
      args.locations.push(
        ...String(value)
          .split(";")
          .map((entry) => entry.trim())
          .filter(Boolean)
      )
    } else if (key === "format") {
      args.format = String(value).trim().toLowerCase()
    } else if (key === "output") {
      args.output = String(value)
    } else if (key === "pretty") {
      args.pretty = true
    } else if (key === "help") {
      args.help = true
    }
  }

  return args
}

function usage() {
  return [
    'Usage: pnpm resource-map:source-search-plan -- --location "Chicago, IL" --categories food,health [--format json|jsonl] [--output plan.json]',
    "",
    "Builds non-network search tasks for finding vetted resource-map sources.",
  ].join("\n")
}

function assertArgs(args) {
  if (args.help) {
    console.log(usage())
    process.exit(0)
  }
  if (args.locations.length === 0) {
    throw new Error("At least one --location is required.")
  }
  if (args.categories.length === 0) {
    throw new Error(
      "At least one --category or --categories value is required."
    )
  }
  if (!["json", "jsonl"].includes(args.format)) {
    throw new Error("--format must be json or jsonl.")
  }

  const unknown = args.categories.filter(
    (category) => !CATEGORY_CONFIG[category]
  )
  if (unknown.length > 0) {
    throw new Error(`Unknown resource categories: ${unknown.join(", ")}`)
  }
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function buildTask({ category, location, intent }) {
  const config = CATEGORY_CONFIG[category]
  const term = config.terms[0]
  const officialTerm = config.officialTerms[0]
  const query = intent.query({ location, term, officialTerm })

  return {
    id: `${slugify(location)}-${category}-${intent.key}`,
    location,
    category,
    categoryLabel: config.label,
    searchIntent: intent.key,
    query,
    sourcePreference: {
      sourceType: intent.sourceType,
      trustLevel: intent.trustLevel,
    },
    evidenceToCapture: [
      "source homepage URL",
      "terms/license URL",
      "attribution text",
      "record sample URL",
      "field-level source URL for name/address/contact/link values",
    ],
    requiredChecks: REQUIRED_CHECKS,
    vettedSourceCandidateShape: {
      name: "TODO: source name after vetting",
      homepageUrl: "TODO: source homepage URL",
      sourceType: intent.sourceType,
      trustLevel: intent.trustLevel,
      licenseLabel: null,
      licenseUrl: null,
      attribution: null,
      refreshCadence: null,
      publicDisplayAllowed: false,
      manualConfirmationRequired: true,
      coverageAreas: [location],
      categories: [category],
      seedQueries: [query],
      scrapeStrategy: {
        mode: "manual-vetting-required",
        searchIntent: intent.key,
        importTarget: "resource_map_import_records",
      },
      discoveryNotes:
        "Generated by scripts/resource-map/build-source-search-plan.mjs. Vet before running discover-sources --apply.",
    },
  }
}

function buildPlan(args) {
  const tasks = args.locations.flatMap((location) =>
    args.categories.flatMap((category) =>
      SEARCH_INTENTS.map((intent) => buildTask({ category, location, intent }))
    )
  )

  return {
    generatedAt: new Date().toISOString(),
    generatedBy: "scripts/resource-map/build-source-search-plan.mjs",
    safetyBoundary:
      "This plan does not scrape or import data. Vet source terms before registration, staging, or public display.",
    locations: args.locations,
    categories: args.categories,
    tasks,
  }
}

function renderPlan(plan, args) {
  if (args.format === "jsonl") {
    return `${plan.tasks.map((task) => JSON.stringify(task)).join("\n")}\n`
  }

  return `${JSON.stringify(plan, null, args.pretty ? 2 : 0)}\n`
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  assertArgs(args)
  const plan = buildPlan(args)
  const rendered = renderPlan(plan, args)

  if (args.output) {
    writeFileSync(args.output, rendered)
    console.log(
      `Wrote ${plan.tasks.length} source search tasks to ${args.output}.`
    )
    return
  }

  process.stdout.write(rendered)
}

main()
