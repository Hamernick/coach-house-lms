#!/usr/bin/env node
import {
  STORE_PATHS,
  appendJsonl,
  createRunRecord,
  finishRunRecord,
  parseArgs,
  readBoolean,
  writeJsonl,
} from "./lib/data-engine/shared.mjs"
import { resolveExtractedFields } from "./lib/normalization.mjs"
import { readResourceMapRecords } from "./lib/read-records.mjs"

const LINK_CHECK_VERSION = "2026-06-28"

function usage() {
  return [
    "Usage:",
    "  pnpm data:check-links -- --input records.jsonl",
    "  pnpm data:check-links -- --input records.jsonl --network true --write",
    "  pnpm data:check-links -- --input records.jsonl --annotate-output annotated-records.jsonl",
    "",
    "Dry-run/local-first by default. Network checks require --network true.",
  ].join("\n")
}

function readString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return null
}

function readArray(value) {
  return Array.isArray(value) ? value : []
}

function readObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {}
}

function normalizeUrl(value) {
  const raw = readString(value)
  if (!raw) return null
  if (!/^https?:\/\//iu.test(raw)) return null

  try {
    const url = new URL(raw)
    url.hash = ""
    return url.toString()
  } catch {
    return null
  }
}

function collectRecordUrls(record) {
  const fields = resolveExtractedFields(record)
  const urls = [
    {
      url: readString(record.sourceUrl, record.source_url, fields.sourceUrl),
      kind: "source",
    },
    {
      url: readString(
        fields.websiteUrl,
        fields.website_url,
        fields.website,
        record.websiteUrl,
        record.website_url
      ),
      kind: "website",
    },
    ...readArray(fields.links ?? record.links).map((link) => ({
      url:
        typeof link === "string"
          ? link
          : readString(link.url, link.href, link.websiteUrl),
      kind: readString(link.type, link.linkType, link.link_type) ?? "link",
    })),
  ]

  return urls
    .map((entry) => ({
      ...entry,
      normalizedUrl: normalizeUrl(entry.url),
    }))
    .filter((entry) => entry.url)
}

function buildUrlPlan(records) {
  const byUrl = new Map()
  const malformed = []

  for (const record of records) {
    const sourceRecordId =
      readString(record.sourceRecordId, record.source_record_id, record.id) ??
      null
    for (const entry of collectRecordUrls(record)) {
      if (!entry.normalizedUrl) {
        malformed.push({
          sourceRecordId,
          url: entry.url,
          kind: entry.kind,
          status: "malformed",
          ok: false,
          reason: "invalid_or_non_http_url",
        })
        continue
      }

      const existing = byUrl.get(entry.normalizedUrl) ?? {
        url: entry.normalizedUrl,
        kind: entry.kind,
        sourceRecordIds: [],
      }
      if (sourceRecordId) existing.sourceRecordIds.push(sourceRecordId)
      byUrl.set(entry.normalizedUrl, existing)
    }
  }

  return {
    urls: [...byUrl.values()].map((entry) => ({
      ...entry,
      sourceRecordIds: [...new Set(entry.sourceRecordIds)],
    })),
    malformed,
  }
}

function withCheckerMetadata(row) {
  return {
    ...row,
    checkedAt: row.checkedAt ?? new Date().toISOString(),
    checkerVersion: row.checkerVersion ?? LINK_CHECK_VERSION,
  }
}

function isFailedCheck(check) {
  if (!check || typeof check !== "object") return false
  if (check.ok === false) return true
  if (check.status === "failed" || check.status === "malformed") return true

  const statusCode = Number(check.status)
  return Number.isFinite(statusCode) && statusCode >= 400
}

function readResultRecordIds(result) {
  return [
    ...readArray(result.sourceRecordIds),
    readString(result.sourceRecordId),
  ].filter(Boolean)
}

function summarizeCheck(result) {
  return {
    url: result.url,
    kind: result.kind,
    status: result.status,
    ok: result.ok,
    reason: result.reason ?? null,
    finalUrl: result.finalUrl ?? null,
    checkedAt: result.checkedAt ?? null,
    checkerVersion: result.checkerVersion ?? LINK_CHECK_VERSION,
  }
}

function buildChecksByRecord(results) {
  const checksByRecord = new Map()

  for (const result of results) {
    const recordIds = readResultRecordIds(result)
    if (!recordIds.length) continue

    for (const recordId of recordIds) {
      const checks = checksByRecord.get(recordId) ?? []
      checks.push(summarizeCheck(result))
      checksByRecord.set(recordId, checks)
    }
  }

  return checksByRecord
}

function mergeUniqueFlag(flags, nextFlag) {
  if (!nextFlag || flags.some((flag) => flag?.code === nextFlag.code)) {
    return flags
  }

  return [...flags, nextFlag]
}

function buildBrokenUrlFlag(linkChecks) {
  const failures = linkChecks.filter(isFailedCheck)
  if (!failures.length) return null

  return {
    code: "broken_url",
    severity: "review",
    message: `${failures.length} URL${
      failures.length === 1 ? "" : "s"
    } failed link validation.`,
  }
}

function readRecordFields(record) {
  return readObject(record.extractedFields ?? record.extracted_fields)
}

function annotateRecordsWithLinkChecks(records, results) {
  const checksByRecord = buildChecksByRecord(results)

  return records.map((record) => {
    const sourceRecordId =
      readString(record.sourceRecordId, record.source_record_id, record.id) ??
      null
    const linkChecks = sourceRecordId
      ? (checksByRecord.get(sourceRecordId) ?? [])
      : []
    if (!linkChecks.length) return record

    const fields = readRecordFields(record)
    const dataQuality = readObject(fields.dataQuality ?? fields.data_quality)
    const existingFlags = readArray(
      record.qualityFlags ?? record.quality_flags ?? dataQuality.flags
    )
    const flags = mergeUniqueFlag(existingFlags, buildBrokenUrlFlag(linkChecks))
    const needsReview =
      record.needsReview === true ||
      record.needs_review === true ||
      flags.some((flag) => flag?.severity === "review")
    const fieldsKey =
      record.extracted_fields && !record.extractedFields
        ? "extracted_fields"
        : "extractedFields"

    return {
      ...record,
      needsReview,
      qualityFlags: flags,
      [fieldsKey]: {
        ...fields,
        linkChecks,
        dataQuality: {
          ...dataQuality,
          schemaVersion: dataQuality.schemaVersion ?? 1,
          linkChecks,
          flags,
          needsReview,
        },
      },
    }
  })
}

async function fetchWithFallback(url) {
  const startedAt = Date.now()
  const headers = {
    Accept: "*/*",
    "User-Agent": "coach-house-resource-map-link-checker/1.0",
  }

  let response
  try {
    response = await fetch(url, {
      method: "HEAD",
      headers,
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
    })
  } catch {
    response = null
  }

  if (!response || response.status === 405 || response.status === 403) {
    response = await fetch(url, {
      method: "GET",
      headers,
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
    })
  }

  return {
    status: response.status,
    ok: response.ok,
    finalUrl: response.url,
    checkedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
  }
}

async function checkUrls(urls) {
  const results = []

  for (const entry of urls) {
    try {
      const result = await fetchWithFallback(entry.url)
      results.push({
        ...entry,
        ...result,
        reason: result.ok ? null : "http_status_not_ok",
      })
    } catch (error) {
      results.push({
        ...entry,
        status: "failed",
        ok: false,
        finalUrl: null,
        checkedAt: new Date().toISOString(),
        durationMs: null,
        reason: error.message,
      })
    }
  }

  return results
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.has("help")) {
    console.log(usage())
    return
  }

  const input = args.get("input") || STORE_PATHS.candidates
  const annotateOutput = readString(args.get("annotate-output"))
  const network = readBoolean(args, "network", false)
  const write = readBoolean(args, "write", false)
  const records = readResourceMapRecords(input)
  const plan = buildUrlPlan(records)
  const run = createRunRecord({ kind: "broken_link_check" })
  const malformedRows = plan.malformed.map(withCheckerMetadata)

  if (!network) {
    if (annotateOutput) {
      writeJsonl(
        annotateOutput,
        annotateRecordsWithLinkChecks(records, malformedRows)
      )
    }

    console.log(
      `Dry run: found ${plan.urls.length} unique HTTP URLs and ${plan.malformed.length} malformed URLs in ${input}. Re-run with --network true to check status.`
    )
    if (annotateOutput) {
      console.log(`Annotated link-check evidence at ${annotateOutput}.`)
    }
    return
  }

  const checked = await checkUrls(plan.urls)
  const checkedRows = checked.map(withCheckerMetadata)
  const failed = [
    ...malformedRows,
    ...checkedRows.filter((result) => !result.ok),
  ]
  const outputRows = [...malformedRows, ...checkedRows]
  const finished = finishRunRecord(run, {
    fetched_count: checked.length,
    parsed_count: plan.urls.length + plan.malformed.length,
    flagged_count: failed.length,
    errors: [
      ...plan.malformed.map((result) => ({
        url: result.url,
        status: result.status,
        reason: result.reason,
      })),
      ...checked
        .filter((result) => !result.ok)
        .map((result) => ({
          url: result.url,
          status: result.status,
          reason: result.reason,
        })),
    ],
  })

  if (write) {
    appendJsonl(STORE_PATHS.linkChecks, outputRows)
    appendJsonl(STORE_PATHS.runs, [finished])
  }
  if (annotateOutput) {
    writeJsonl(
      annotateOutput,
      annotateRecordsWithLinkChecks(records, outputRows)
    )
  }

  console.log(
    `Checked ${checked.length} URLs; ${failed.length} need review. ${
      write
        ? `Saved results to ${STORE_PATHS.linkChecks}.`
        : "Pass --write to save results."
    }${annotateOutput ? ` Annotated records at ${annotateOutput}.` : ""}`
  )
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
