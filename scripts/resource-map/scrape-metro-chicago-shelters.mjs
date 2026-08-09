#!/usr/bin/env node
import { mkdir, rename, rm, writeFile } from "node:fs/promises"
import path from "node:path"

import { createEnrichmentCoverageAccumulator } from "./lib/enrichment-coverage.mjs"
import {
  buildMetroChicagoProgramsUrl,
  buildMetroChicagoShelterRecord,
  isPublicMetroChicagoHousingProgram,
  METRO_CHICAGO_HOUSING_CATEGORY_IDS,
} from "./lib/metro-chicago-shelters.mjs"

const DEFAULT_OUTPUT =
  "data/resource-map/.engine/211-metro-chicago-housing-services.jsonl"
const REQUEST_HEADERS = {
  Accept: "application/json",
  Origin: "https://211metrochicago.org",
  Referer: "https://211metrochicago.org/search-for-resources/",
  "User-Agent": "Mozilla/5.0 CoachHouseResourceMap/1.0",
}

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

async function fetchJson(url, attempts = 4) {
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 20_000)
    try {
      const response = await fetch(url, {
        headers: REQUEST_HEADERS,
        signal: controller.signal,
      })
      if (response.status === 429) {
        const retryAfter = Math.min(
          Number(response.headers.get("retry-after") ?? 5),
          30
        )
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000))
        continue
      }
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      lastError = error
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 500))
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

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.has("help")) {
    console.log(
      "Usage: pnpm resource-map:scrape-shelters -- --network true [--write] [--output <records.jsonl>]"
    )
    return
  }
  if (String(args.get("network")) !== "true") {
    throw new Error("Network access requires --network true.")
  }
  const options = await fetchJson("https://api.211metrochicago.org/api/options")
  const cityById = new Map(
    (options.cities ?? []).map((city) => [Number(city.id), city.name])
  )
  const rows = []
  for (const categoryId of METRO_CHICAGO_HOUSING_CATEGORY_IDS) {
    const firstUrl = buildMetroChicagoProgramsUrl({ categoryId, page: 1 })
    const first = await fetchJson(firstUrl)
    const firstPage = first.programs
    rows.push(
      ...(firstPage?.data ?? []).map((program) => ({
        categoryId,
        program,
        rawApiUrl: firstUrl,
      }))
    )
    for (let page = 2; page <= Number(firstPage?.last_page ?? 1); page += 1) {
      const rawApiUrl = buildMetroChicagoProgramsUrl({ categoryId, page })
      const response = await fetchJson(rawApiUrl)
      rows.push(
        ...(response.programs?.data ?? []).map((program) => ({
          categoryId,
          program,
          rawApiUrl,
        }))
      )
    }
  }
  const activeUniqueRows = [
    ...new Map(
      rows
        .filter(
          ({ program }) =>
            program.agency_status === "Active" &&
            !program.deleted_at &&
            program.is_unique !== 0
        )
        .map((row) => [String(row.program.id), row])
    ).values(),
  ]
  const uniqueRows = activeUniqueRows.filter(({ program }) =>
    isPublicMetroChicagoHousingProgram(program)
  )
  const fetchedAt = new Date().toISOString()
  const records = uniqueRows.map(({ categoryId, program, rawApiUrl }) =>
    buildMetroChicagoShelterRecord({
      cityName: cityById.get(Number(program.site?.city_id)) ?? null,
      fetchedAt,
      program,
      rawApiUrl,
      requestedCategoryId: categoryId,
    })
  )
  const coverage = createEnrichmentCoverageAccumulator()
  for (const record of records) coverage.add(record)
  const summary = coverage.summary()
  console.log(
    `Fetched ${rows.length} housing-directory rows; retained ${records.length} public shelter, homeless-service, transitional-housing, and drop-in programs; held ${activeUniqueRows.length - uniqueRows.length} residential-care listings.`
  )
  console.log(
    `Coverage: complete=${summary.total.complete}/${summary.total.total}; publishable=${summary.total.publishable}/${summary.total.total}.`
  )
  console.log(
    `Fields: ${Object.entries(summary.total.metrics)
      .map(([key, count]) => `${key}=${count}`)
      .join(", ")}.`
  )
  const output = String(args.get("output") ?? DEFAULT_OUTPUT)
  if (args.has("write")) {
    await writeJsonlAtomically(output, records)
    console.log(`Wrote ${output} atomically.`)
  } else {
    console.log("Dry run only; no JSONL written.")
  }
}

await main()
