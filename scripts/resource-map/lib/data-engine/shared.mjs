import { createHash, randomUUID } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, isAbsolute, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

export const ENGINE_VERSION = "2026-06-28-local-prototype"
export const CONNECTOR_VERSION = "2026-06-28"
export const PARSER_VERSION = "2026-06-28"
export const ROOT = process.cwd()
export const ENGINE_DIR =
  process.env.RESOURCE_MAP_ENGINE_DIR ?? join(ROOT, "data/resource-map/.engine")

export const STORE_PATHS = {
  sourceRegistry: join(ENGINE_DIR, "source-registry.jsonl"),
  runs: join(ENGINE_DIR, "runs.jsonl"),
  rawPayloads: join(ENGINE_DIR, "raw-payloads.jsonl"),
  candidates: join(ENGINE_DIR, "candidate-records.jsonl"),
  geocodeCache: join(ENGINE_DIR, "geocode-cache.jsonl"),
  linkChecks: join(ENGINE_DIR, "link-checks.jsonl"),
  sourceFreshness: join(ENGINE_DIR, "source-freshness.jsonl"),
}

export const CONNECTOR_TYPES = [
  "csv",
  "json",
  "xml",
  "excel",
  "ckan",
  "socrata",
  "arcgis",
  "irs_eo_bmf",
  "osm_overpass",
  "wikidata_sparql",
  "sitemap",
  "rss_atom",
  "static_html",
  "playwright_scrape",
]

export function parseArgs(argv) {
  const args = new Map()

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (!arg.startsWith("--")) continue

    const key = arg.slice(2)
    const next = argv[index + 1]
    if (!next || next.startsWith("--")) {
      args.set(key, true)
      continue
    }

    args.set(key, next)
    index += 1
  }

  return args
}

export function readString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return null
}

export function readArray(value) {
  if (Array.isArray(value)) return value.filter((entry) => entry !== "")
  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
  }
  return []
}

export function readArgList(args, key, fallback = []) {
  return args.has(key) ? readArray(args.get(key)) : fallback
}

export function readBoolean(args, key, fallback = false) {
  if (!args.has(key)) return fallback
  const value = args.get(key)
  if (value === true) return true
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase())
}

export function slugify(value, fallback = "resource-source") {
  const source = readString(value, fallback) ?? fallback
  const slug = source
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100)

  return slug || fallback
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex")
}

export function ensureParent(filePath) {
  mkdirSync(dirname(filePath), { recursive: true })
}

export function readJsonl(filePath) {
  if (!existsSync(filePath)) return []
  const raw = readFileSync(filePath, "utf8").trim()
  if (!raw) return []

  return raw.split(/\r?\n/).map((line, index) => {
    try {
      return JSON.parse(line)
    } catch (error) {
      throw new Error(
        `Invalid JSONL in ${filePath} at line ${index + 1}: ${error.message}`
      )
    }
  })
}

export function writeJsonl(filePath, rows) {
  ensureParent(filePath)
  const body = rows.map((row) => JSON.stringify(row)).join("\n")
  writeFileSync(filePath, body ? `${body}\n` : "")
}

export function appendJsonl(filePath, rows) {
  const existing = readJsonl(filePath)
  writeJsonl(filePath, [...existing, ...rows])
}

export function upsertJsonl(filePath, rows, keyFn) {
  const byKey = new Map()
  for (const row of readJsonl(filePath)) byKey.set(keyFn(row), row)
  for (const row of rows) byKey.set(keyFn(row), row)
  writeJsonl(filePath, [...byKey.values()])
}

export function resolveLocalPath(value) {
  const raw = readString(value)
  if (!raw) return null

  if (raw.startsWith("file://")) return fileURLToPath(raw)
  if (/^https?:\/\//i.test(raw)) return null

  return isAbsolute(raw) ? raw : resolve(ROOT, raw)
}

export function toFileUrl(filePath) {
  return pathToFileURL(resolve(filePath)).href
}

export function nowIso() {
  return new Date().toISOString()
}

export function createRunRecord({
  kind,
  sourceId = null,
  connectorType = null,
}) {
  const startedAt = nowIso()
  return {
    run_id: randomUUID(),
    kind,
    source_id: sourceId,
    connector_type: connectorType,
    status: "running",
    started_at: startedAt,
    finished_at: null,
    fetched_count: 0,
    parsed_count: 0,
    normalized_count: 0,
    classified_count: 0,
    deduped_count: 0,
    flagged_count: 0,
    errors: [],
  }
}

export function finishRunRecord(run, patch) {
  return {
    ...run,
    ...patch,
    status: patch.errors?.length ? "completed_with_errors" : "completed",
    finished_at: nowIso(),
  }
}

export function normalizeSourceId(source) {
  return readString(
    source.sourceId,
    source.source_id,
    source.id,
    source.slug,
    slugify(source.name ?? source.url ?? source.rawUrl)
  )
}

export function inferContentType(urlOrPath, fallback = "text/plain") {
  const value = String(urlOrPath ?? "").toLowerCase()
  if (value.endsWith(".csv")) return "text/csv"
  if (value.endsWith(".json") || value.endsWith(".jsonl"))
    return "application/json"
  if (value.endsWith(".xml") || value.includes("sitemap")) return "text/xml"
  if (value.endsWith(".rss") || value.endsWith(".atom"))
    return "application/rss+xml"
  if (value.endsWith(".html") || value.endsWith(".htm")) return "text/html"
  if (value.endsWith(".xls") || value.endsWith(".xlsx"))
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  return fallback
}
