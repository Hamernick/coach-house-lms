#!/usr/bin/env node
import { execFile } from "node:child_process"
import { mkdir, rename, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import { promisify } from "node:util"

import { createEnrichmentCoverageAccumulator } from "./lib/enrichment-coverage.mjs"
import {
  buildCensusGeocodeUrl,
  buildCookCountyImmigrantResourceRecord,
  COOK_COUNTY_IMMIGRANT_RESOURCE_DEFAULTS,
} from "./lib/cook-county-immigrant-resources.mjs"

const execFileAsync = promisify(execFile)
const DEFAULT_PDF = "tmp/pdfs/cook-county-immigrant-refugee-organizations.pdf"
const DEFAULT_OUTPUT =
  "data/resource-map/.engine/cook-county-immigrant-refugee-organizations.jsonl"

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

async function fetchResponse(url, attempts = 3) {
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 20_000)
    try {
      const response = await fetch(url, { signal: controller.signal })
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`)
      }
      return response
    } catch (error) {
      lastError = error
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 300))
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
      "Usage: pnpm resource-map:scrape-immigrant-services -- --network true [--write] [--output <records.jsonl>]"
    )
    return
  }
  if (String(args.get("network")) !== "true") {
    throw new Error("Network access requires --network true.")
  }
  const pdfPath = String(args.get("pdf") ?? DEFAULT_PDF)
  const output = String(args.get("output") ?? DEFAULT_OUTPUT)
  await mkdir(path.dirname(pdfPath), { recursive: true })
  const pdfResponse = await fetchResponse(
    COOK_COUNTY_IMMIGRANT_RESOURCE_DEFAULTS.sourceUrl
  )
  await writeFile(pdfPath, Buffer.from(await pdfResponse.arrayBuffer()))
  const { stdout } = await execFileAsync(
    "python3",
    [
      "scripts/resource-map/extract-cook-county-directory.py",
      "--input",
      pdfPath,
    ],
    { maxBuffer: 10 * 1024 * 1024 }
  )
  const rows = JSON.parse(stdout)
  const concurrency = Math.max(
    1,
    Number.parseInt(String(args.get("concurrency") ?? "4"), 10)
  )
  const geocodes = await mapConcurrent(rows, concurrency, async (row) => {
    if (!row.address) return null
    const response = await fetchResponse(buildCensusGeocodeUrl(row.address), 2)
    const payload = await response.json()
    return payload?.result?.addressMatches?.[0] ?? null
  })
  const fetchedAt = new Date().toISOString()
  const records = rows
    .map((row, index) => {
      try {
        return buildCookCountyImmigrantResourceRecord({
          fetchedAt,
          geocode: geocodes[index],
          row,
        })
      } catch {
        return null
      }
    })
    .filter(Boolean)
  const coverage = createEnrichmentCoverageAccumulator()
  for (const record of records) coverage.add(record)
  const summary = coverage.summary()
  const geocoded = records.filter((record) =>
    Number.isFinite(record.extractedFields.latitude)
  ).length

  console.log(
    `Extracted ${rows.length} directory rows; built ${records.length} records; geocoded ${geocoded}.`
  )
  console.log(
    `Coverage: complete=${summary.total.complete}/${summary.total.total}; publishable=${summary.total.publishable}/${summary.total.total}.`
  )
  console.log(
    `Fields: ${Object.entries(summary.total.metrics)
      .map(([key, count]) => `${key}=${count}`)
      .join(", ")}.`
  )
  if (args.has("write")) {
    await writeJsonlAtomically(output, records)
    console.log(`Wrote ${output} atomically.`)
  } else {
    console.log("Dry run only; no JSONL written.")
  }
}

await main()
