#!/usr/bin/env node
import { mkdir, rename, rm, writeFile } from "node:fs/promises"
import path from "node:path"

import { createEnrichmentCoverageAccumulator } from "./lib/enrichment-coverage.mjs"
import {
  buildFeedingIllinoisRecord,
  buildLocationSearchUrl,
  buildRegionMapUrl,
  buildSchedulesUrl,
  dedupeFeedingIllinoisRecords,
  FEEDING_ILLINOIS_DEFAULTS,
} from "./lib/feeding-illinois-food-resources.mjs"

const DEFAULT_OUTPUT =
  "data/resource-map/.engine/feeding-illinois-food-resources.jsonl"
const PAGE_SIZE = 20

function parseArgs(argv) {
  const args = new Map()
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
    if (!value.startsWith("--")) continue
    const key = value.slice(2)
    const next = argv[index + 1]
    if (!next || next.startsWith("--")) args.set(key, true)
    else {
      args.set(key, next)
      index += 1
    }
  }
  return args
}

function numberArg(args, key, fallback) {
  const value = Number(args.get(key) ?? fallback)
  if (!Number.isFinite(value)) throw new Error(`--${key} must be a number.`)
  return value
}

function chunks(values, size) {
  const result = []
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size))
  }
  return result
}

async function mapConcurrent(values, concurrency, mapper) {
  const results = new Array(values.length)
  let nextIndex = 0
  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex
      nextIndex += 1
      results[index] = await mapper(values[index], index)
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, worker)
  )
  return results
}

async function fetchJson(url, { attempts = 3, timeoutMs = 20_000 } = {}) {
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      })
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      lastError = error
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, 250 * attempt))
      }
    } finally {
      clearTimeout(timer)
    }
  }
  throw new Error(`Failed to fetch ${url}: ${lastError?.message ?? lastError}`)
}

async function writeJsonlAtomically(output, records) {
  const temporary = `${output}.tmp-${process.pid}`
  await mkdir(path.dirname(output), { recursive: true })
  await rm(temporary, { force: true })
  try {
    await writeFile(
      temporary,
      records.map((record) => JSON.stringify(record)).join("\n") + "\n",
      { encoding: "utf8", flag: "wx" }
    )
    await rename(temporary, output)
  } catch (error) {
    await rm(temporary, { force: true })
    throw error
  }
}

function printCoverage(coverage) {
  const metrics = Object.entries(coverage.total.metrics)
    .map(([key, count]) => `${key}=${count}`)
    .join(", ")
  console.log(
    `Coverage: complete=${coverage.total.complete}/${coverage.total.total}; publishable=${coverage.total.publishable}/${coverage.total.total}.`
  )
  console.log(`Fields: ${metrics}.`)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.has("help")) {
    console.log(
      "Usage: pnpm resource-map:scrape-food -- --network true [--write] [--output <records.jsonl>] [--limit <count>] [--concurrency <count>]"
    )
    return
  }
  if (String(args.get("network")) !== "true") {
    throw new Error("Network access requires --network true.")
  }

  const apiBaseUrl = String(
    args.get("api-base-url") ?? FEEDING_ILLINOIS_DEFAULTS.apiBaseUrl
  )
  const concurrency = Math.max(1, Math.floor(numberArg(args, "concurrency", 6)))
  const limit = args.has("limit")
    ? Math.max(0, Math.floor(numberArg(args, "limit", 0)))
    : Infinity
  const output = String(args.get("output") ?? DEFAULT_OUTPUT)
  const regionId = numberArg(
    args,
    "region-id",
    FEEDING_ILLINOIS_DEFAULTS.regionId
  )
  const regionMapId = numberArg(
    args,
    "region-map-id",
    FEEDING_ILLINOIS_DEFAULTS.regionMapId
  )
  const regionMap = await fetchJson(
    buildRegionMapUrl({
      apiBaseUrl,
      mapToken: String(
        args.get("map-token") ?? FEEDING_ILLINOIS_DEFAULTS.mapToken
      ),
    })
  )
  if (
    Number(regionMap.regionId) !== regionId ||
    Number(regionMap.regionMapId) !== regionMapId
  ) {
    throw new Error(
      `Locator identity mismatch: expected region ${regionId}/map ${regionMapId}.`
    )
  }

  const searchOptions = {
    apiBaseUrl,
    latitude: numberArg(args, "latitude", 41.8781),
    longitude: numberArg(args, "longitude", -87.6298),
    radius: numberArg(args, "radius", 60),
    regionId,
    regionMapId,
  }
  const firstUrl = buildLocationSearchUrl({ ...searchOptions, page: 0 })
  const firstPage = await fetchJson(firstUrl)
  const sourceTotal = Number(firstPage.item5 ?? firstPage.totalCount ?? 0)
  const requestedTotal = Math.min(sourceTotal, limit)
  const pageCount = Math.ceil(requestedTotal / PAGE_SIZE)
  const remainingPages = Array.from(
    { length: Math.max(0, pageCount - 1) },
    (_, index) => index + 1
  )
  const pages = await mapConcurrent(
    remainingPages,
    concurrency,
    async (page) => ({
      page,
      response: await fetchJson(
        buildLocationSearchUrl({ ...searchOptions, page })
      ),
    })
  )
  const locations = [{ page: 0, response: firstPage }, ...pages]
    .flatMap(({ page, response }) =>
      (Array.isArray(response.item1) ? response.item1 : []).map((location) => ({
        location,
        rawApiUrl: buildLocationSearchUrl({ ...searchOptions, page }),
      }))
    )
    .slice(0, requestedTotal)
  const uniqueLocationEntries = [
    ...new Map(
      locations.map((entry) => [String(entry.location.locationId), entry])
    ).values(),
  ]
  const ids = uniqueLocationEntries.map((entry) => entry.location.locationId)
  const scheduleResponses = await mapConcurrent(
    chunks(ids, 40),
    concurrency,
    async (locationIds) =>
      fetchJson(buildSchedulesUrl({ apiBaseUrl, locationIds, regionId }))
  )
  const schedulesByLocation = new Map()
  for (const schedule of scheduleResponses.flat()) {
    const key = String(schedule.locationId)
    const entries = schedulesByLocation.get(key) ?? []
    entries.push(schedule)
    schedulesByLocation.set(key, entries)
  }
  const fetchedAt = new Date().toISOString()
  const records = dedupeFeedingIllinoisRecords(
    uniqueLocationEntries.map(({ location, rawApiUrl }) =>
      buildFeedingIllinoisRecord({
        fetchedAt,
        location,
        rawApiUrl,
        schedules: schedulesByLocation.get(String(location.locationId)) ?? [],
      })
    )
  )
  const coverage = createEnrichmentCoverageAccumulator()
  for (const record of records) coverage.add(record)

  console.log(
    `Fetched ${uniqueLocationEntries.length}/${sourceTotal} source locations; retained ${records.length} unique service locations from ${regionMap.mapName}.`
  )
  console.log(
    `Schedules: ${schedulesByLocation.size}/${records.length} locations have structured schedule rows.`
  )
  printCoverage(coverage.summary())
  if (args.has("write")) {
    await writeJsonlAtomically(output, records)
    console.log(`Wrote ${output} atomically.`)
  } else {
    console.log("Dry run only; no file written.")
  }
}

await main()
