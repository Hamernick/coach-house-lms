#!/usr/bin/env node
import { readFileSync } from "node:fs"
import { pathToFileURL } from "node:url"

import { createResourceMapAdminClient } from "./lib/env.mjs"

const ALLOWED_SOURCE_TYPES = new Set([
  "manual",
  "csv",
  "api",
  "directory",
  "scrape",
  "partner",
  "seed",
])

const ALLOWED_TRUST_LEVELS = new Set([
  "official",
  "partner",
  "community",
  "unverified",
])

function parseArgs(argv) {
  const args = new Map()
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (!arg.startsWith("--")) continue
    const key = arg.slice(2)
    const next = argv[i + 1]
    if (!next || next.startsWith("--")) {
      args.set(key, true)
    } else {
      args.set(key, next)
      i += 1
    }
  }
  return args
}

function readCandidates(filePath) {
  const raw = readFileSync(filePath, "utf8").trim()
  if (!raw) return []

  if (raw.startsWith("[") || raw.startsWith("{")) {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
    if (Array.isArray(parsed.sources)) return parsed.sources
    return [parsed]
  }

  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line)
      } catch (error) {
        throw new Error(
          `Invalid source JSONL at line ${index + 1}: ${error.message}`
        )
      }
    })
}

function readString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return null
}

function readObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {}
}

function normalizeSlug(value, fallback) {
  const source = readString(value, fallback)
  if (!source) return null

  return source
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

function normalizeSourceType(value) {
  const normalized = readString(value)?.toLowerCase() ?? "manual"
  return ALLOWED_SOURCE_TYPES.has(normalized) ? normalized : "manual"
}

function normalizeTrustLevel(value) {
  const normalized = readString(value)?.toLowerCase() ?? "unverified"
  return ALLOWED_TRUST_LEVELS.has(normalized) ? normalized : "unverified"
}

export function buildSourcePayload(candidate, args = new Map()) {
  const name = readString(candidate.name, candidate.title)
  const homepageUrl = readString(
    candidate.homepageUrl,
    candidate.homepage_url,
    candidate.url,
    candidate.sourceUrl,
    candidate.source_url
  )
  const slug = normalizeSlug(candidate.slug, name ?? homepageUrl)

  if (!name || !slug) {
    throw new Error("Every source candidate needs a name and slug or URL.")
  }
  const candidateMetadata = readObject(candidate.metadata)
  const rawUrl = readString(
    candidate.rawUrl,
    candidate.raw_url,
    candidate.apiEndpoint,
    candidate.api_endpoint
  )
  const connectorType = readString(
    candidate.connectorType,
    candidate.connector_type
  )

  return {
    name,
    slug,
    homepage_url: homepageUrl,
    source_type: normalizeSourceType(
      candidate.sourceType ?? candidate.source_type
    ),
    license_label: readString(candidate.licenseLabel, candidate.license_label),
    license_url: readString(candidate.licenseUrl, candidate.license_url),
    attribution: readString(candidate.attribution),
    refresh_cadence: readString(
      candidate.refreshCadence,
      candidate.refresh_cadence
    ),
    trust_level: normalizeTrustLevel(
      candidate.trustLevel ?? candidate.trust_level
    ),
    metadata: {
      ...candidateMetadata,
      discoveryStatus: "candidate",
      discoveredBy: "scripts/resource-map/discover-sources.mjs",
      discoveredAt: new Date().toISOString(),
      discoveryRunLabel: readString(args.get("run-label")),
      sourceId: readString(
        candidate.sourceId,
        candidate.source_id,
        candidate.id
      ),
      connectorType,
      rawUrl,
      apiEndpoint: readString(candidate.apiEndpoint, candidate.api_endpoint),
      rawStoreTable:
        readString(candidateMetadata.rawStoreTable) ??
        "resource_map_raw_ingestion_records",
      discoveryNotes: readString(candidate.discoveryNotes, candidate.notes),
      termsNotes: readString(candidate.termsNotes, candidate.terms_notes),
      publicDisplayAllowed: Boolean(
        candidate.publicDisplayAllowed ?? candidate.public_display_allowed
      ),
      requiresAttribution: Boolean(
        candidate.requiresAttribution ?? candidate.requires_attribution
      ),
      manualConfirmationRequired:
        candidate.manualConfirmationRequired ??
        candidate.manual_confirmation_required ??
        true,
      coverageAreas: Array.isArray(candidate.coverageAreas)
        ? candidate.coverageAreas
        : candidate.coverage_areas,
      categories: candidate.categories ?? candidate.resourceCategories,
      discoveryQueries:
        candidate.discoveryQueries ?? candidate.discovery_queries,
      seedQueries: candidate.seedQueries ?? candidate.seed_queries,
      scrapeStrategy: candidate.scrapeStrategy ?? candidate.scrape_strategy,
      contact: candidate.contact ?? null,
    },
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const input = args.get("input")
  const apply = Boolean(args.get("apply"))

  if (!input) {
    throw new Error(
      "Usage: pnpm resource-map:discover-sources -- --input sources.jsonl [--apply]"
    )
  }

  const payload = readCandidates(input).map((candidate) =>
    buildSourcePayload(candidate, args)
  )

  if (!apply) {
    console.log(
      `Dry run: parsed ${payload.length} source candidates. Re-run with --apply to upsert resource_map_sources.`
    )
    for (const source of payload.slice(0, 10)) {
      console.log(`- ${source.slug}: ${source.name} (${source.source_type})`)
    }
    return
  }

  const admin = createResourceMapAdminClient()
  const { data, error } = await admin
    .from("resource_map_sources")
    .upsert(payload, { onConflict: "slug" })
    .select("id,slug")

  if (error) throw error

  console.log(`Upserted ${data?.length ?? 0} resource source candidates.`)
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
}
