import { readFileSync } from "node:fs"
import { buildRawRecord, parseRawPayload } from "./parsers.mjs"
import {
  CONNECTOR_TYPES,
  inferContentType,
  nowIso,
  readString,
  resolveLocalPath,
  toFileUrl,
} from "./shared.mjs"

const DEFAULT_TIMEOUT_MS = 15_000
const DEFAULT_RETRY_DELAY_MS = 500
const DEFAULT_RETRY_COUNT = 2
const DEFAULT_PLAYWRIGHT_WAIT_UNTIL = "domcontentloaded"
const POST_QUERY_LENGTH_THRESHOLD = 1800
const PAGED_CONNECTOR_TYPES = new Set(["ckan", "socrata", "arcgis"])

function isExcelContent(contentType, urlOrPath) {
  const value = `${contentType ?? ""} ${urlOrPath ?? ""}`.toLowerCase()
  return (
    value.includes("spreadsheetml") ||
    value.includes("application/vnd.ms-excel") ||
    value.endsWith(".xlsx") ||
    value.endsWith(".xls")
  )
}

function readMetadata(source) {
  return source?.metadata && typeof source.metadata === "object"
    ? source.metadata
    : {}
}

function inferEndpoint(source) {
  const metadata = readMetadata(source)
  return readString(
    source.rawUrl,
    source.raw_url,
    source.apiEndpoint,
    source.api_endpoint,
    metadata.rawUrl,
    metadata.raw_url,
    metadata.apiEndpoint,
    metadata.api_endpoint,
    source.url,
    source.sourceUrl,
    source.homepageUrl,
    source.homepage_url
  )
}

function buildDerivedUrl(source) {
  const endpoint = inferEndpoint(source)
  const metadata = readMetadata(source)
  const connectorType =
    source.connectorType ?? source.connector_type ?? metadata.connectorType
  if (!endpoint) return null
  if (resolveLocalPath(endpoint)) return endpoint
  if (connectorType === "ckan" && !endpoint.includes("/api/3/action/")) {
    const url = new URL("/api/3/action/package_search", endpoint)
    for (const query of source.discoveryQueries ??
      source.seedQueries ??
      metadata.discoveryQueries ??
      metadata.seedQueries ??
      []) {
      url.searchParams.set("q", query)
      break
    }
    return url.toString()
  }
  if (connectorType === "socrata") {
    const url = new URL(endpoint)
    if (!url.searchParams.has("$limit")) url.searchParams.set("$limit", "5000")
    return url.toString()
  }
  if (connectorType === "arcgis" && !endpoint.includes("/query")) {
    const url = new URL(`${endpoint.replace(/\/$/u, "")}/query`)
    url.searchParams.set("where", "1=1")
    url.searchParams.set("outFields", "*")
    url.searchParams.set("returnGeometry", "true")
    url.searchParams.set("outSR", "4326")
    url.searchParams.set("f", "json")
    return url.toString()
  }
  if (connectorType === "osm_overpass") {
    const url = new URL(endpoint)
    const query = readString(
      source.overpassQuery,
      source.overpass_query,
      metadata.overpassQuery,
      metadata.overpass_query
    )
    if (query && !url.searchParams.has("data")) {
      url.searchParams.set("data", query)
    }
    return url.toString()
  }
  if (connectorType === "wikidata_sparql") {
    const url = new URL(endpoint)
    if (!url.searchParams.has("format")) url.searchParams.set("format", "json")
    const query = readString(
      source.sparqlQuery,
      source.sparql_query,
      metadata.sparqlQuery,
      metadata.sparql_query
    )
    if (query && !url.searchParams.has("query")) {
      url.searchParams.set("query", query)
    }
    return url.toString()
  }
  return endpoint
}

export function buildDerivedConnectorUrl(source) {
  return buildDerivedUrl(source)
}

export function buildConnectorHttpRequest(source) {
  const connectorType = normalizeConnectorType(source)
  const url = buildDerivedUrl({ ...source, connectorType })
  const request = buildHttpRequest(url, { ...source, connectorType })
  return {
    url: request.url,
    rawUrl: request.rawUrl ?? request.url,
    method: request.method,
    body: request.init?.body?.toString?.() ?? null,
  }
}

function normalizeInteger(value, fallback, min, max) {
  const parsed = Number.parseInt(String(value ?? fallback), 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(parsed, min), max)
}

function readBooleanValue(...values) {
  for (const value of values) {
    if (typeof value === "boolean") return value
    if (typeof value === "string" && value.trim()) {
      const normalized = value.toLowerCase()
      if (["1", "true", "yes", "on"].includes(normalized)) return true
      if (["0", "false", "no", "off"].includes(normalized)) return false
    }
  }
  return null
}

function readConnectorOptions(source, options = {}) {
  return {
    retries: normalizeInteger(
      options.retries ?? source.retries ?? source.retryCount,
      DEFAULT_RETRY_COUNT,
      0,
      8
    ),
    timeoutMs: normalizeInteger(
      options.timeoutMs ?? source.timeoutMs ?? source.timeout_ms,
      DEFAULT_TIMEOUT_MS,
      100,
      120_000
    ),
    retryDelayMs: normalizeInteger(
      options.retryDelayMs ?? source.retryDelayMs ?? source.retry_delay_ms,
      DEFAULT_RETRY_DELAY_MS,
      0,
      60_000
    ),
  }
}

function readPaginationOptions(source = {}) {
  const metadata = readMetadata(source)
  const paginationEnabled =
    readBooleanValue(
      source.pagination,
      source.paginationEnabled,
      source.pagination_enabled,
      metadata.pagination,
      metadata.paginationEnabled,
      metadata.pagination_enabled
    ) ?? true
  const pageSize = normalizeInteger(
    source.pageSize ??
      source.page_size ??
      metadata.pageSize ??
      metadata.page_size,
    500,
    1,
    5000
  )

  return {
    enabled: paginationEnabled,
    maxPages: paginationEnabled
      ? normalizeInteger(
          source.maxPages ??
            source.max_pages ??
            metadata.maxPages ??
            metadata.max_pages,
          5,
          1,
          50
        )
      : 1,
    pageSize,
    totalRows: normalizeOptionalInteger(
      source.totalRows ??
        source.total_rows ??
        metadata.totalRows ??
        metadata.total_rows,
      1
    ),
  }
}

function normalizeOptionalInteger(
  value,
  min = 0,
  max = Number.MAX_SAFE_INTEGER
) {
  if (value == null || value === "") return null
  const parsed = Number.parseInt(String(value), 10)
  if (!Number.isFinite(parsed)) return null
  return Math.min(Math.max(parsed, min), max)
}

function readPlaywrightOptions(source = {}) {
  return {
    waitUntil: readString(
      source.playwrightWaitUntil,
      source.playwright_wait_until,
      source.waitUntil,
      DEFAULT_PLAYWRIGHT_WAIT_UNTIL
    ),
    waitForSelector: readString(
      source.playwrightWaitForSelector,
      source.playwright_wait_for_selector,
      source.waitForSelector
    ),
    required:
      source.playwrightRequired === true ||
      source.playwright_required === true ||
      source.renderingRequired === true ||
      source.rendering_required === true,
    executablePath: readString(
      source.playwrightExecutablePath,
      source.playwright_executable_path,
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ),
  }
}

function readFetchMethod(source = {}) {
  const metadata = readMetadata(source)
  return readString(
    source.fetchMethod,
    source.fetch_method,
    source.httpMethod,
    source.http_method,
    metadata.fetchMethod,
    metadata.fetch_method,
    metadata.httpMethod,
    metadata.http_method
  )?.toUpperCase()
}

function buildHttpRequest(urlOrPath, source = {}) {
  const metadata = readMetadata(source)
  const connectorType =
    source.connectorType ?? source.connector_type ?? metadata.connectorType
  const requestedMethod = readFetchMethod(source)
  if (!["osm_overpass", "wikidata_sparql"].includes(connectorType)) {
    return { url: urlOrPath, method: "GET" }
  }

  const url = new URL(urlOrPath)
  const queryParam = connectorType === "osm_overpass" ? "data" : "query"
  const query = url.searchParams.get(queryParam)
  const shouldPost =
    requestedMethod === "POST" ||
    (query && query.length > POST_QUERY_LENGTH_THRESHOLD)
  if (!shouldPost || !query) {
    return { url: urlOrPath, method: "GET" }
  }

  const body = new URLSearchParams()
  if (connectorType === "osm_overpass") {
    body.set("data", query)
  } else {
    body.set("query", query)
    body.set("format", url.searchParams.get("format") ?? "json")
  }
  const requestUrl = new URL(url.toString())
  requestUrl.search = ""

  return {
    url: requestUrl.toString(),
    rawUrl: urlOrPath,
    method: "POST",
    init: {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
    },
  }
}

function sleep(ms) {
  return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : null
}

async function fetchTextOnce(urlOrPath, source, options) {
  const localPath = resolveLocalPath(urlOrPath)
  if (localPath) {
    const contentType = inferContentType(localPath)
    const rawBuffer = readFileSync(localPath)
    if (isExcelContent(contentType, localPath)) {
      return {
        rawText: rawBuffer.toString("base64"),
        rawTextEncoding: "base64",
        rawByteLength: rawBuffer.byteLength,
        contentType,
        rawUrl: urlOrPath,
        statusCode: 200,
        finalUrl: urlOrPath,
      }
    }

    return {
      rawText: rawBuffer.toString("utf8"),
      rawTextEncoding: "utf8",
      rawByteLength: rawBuffer.byteLength,
      contentType,
      rawUrl: urlOrPath,
      statusCode: 200,
      finalUrl: urlOrPath,
    }
  }

  const request = buildHttpRequest(urlOrPath, source)
  const response = await fetch(request.url, {
    ...(request.init ?? {}),
    headers: {
      Accept: "*/*",
      "User-Agent": "coach-house-resource-map-local-prototype/1.0",
      ...(request.init?.headers ?? {}),
    },
    signal: AbortSignal.timeout(options.timeoutMs),
  })
  if (!response.ok) {
    throw new Error(
      `Fetch failed ${response.status} for ${request.rawUrl ?? urlOrPath}`
    )
  }
  const contentType =
    response.headers.get("content-type") ??
    inferContentType(urlOrPath, "text/plain")
  const binaryExcel = isExcelContent(contentType, urlOrPath)
  const rawBuffer = binaryExcel
    ? Buffer.from(await response.arrayBuffer())
    : null
  const rawText = rawBuffer
    ? rawBuffer.toString("base64")
    : await response.text()

  return {
    rawText,
    rawTextEncoding: binaryExcel ? "base64" : "utf8",
    rawByteLength: rawBuffer?.byteLength ?? Buffer.byteLength(rawText, "utf8"),
    contentType,
    rawUrl: request.rawUrl ?? response.url ?? urlOrPath,
    statusCode: response.status,
    finalUrl: response.url || urlOrPath,
    fetchMethod: request.method,
    requestUrl: request.url,
  }
}

async function fetchText(urlOrPath, source, options) {
  const attempts = []
  const maxAttempts = options.retries + 1

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const startedAt = nowIso()
    try {
      const result = await fetchTextOnce(urlOrPath, source, options)
      attempts.push({
        attempt,
        startedAt,
        finishedAt: nowIso(),
        status: "success",
        statusCode: result.statusCode,
        finalUrl: result.finalUrl,
        fetchMethod: result.fetchMethod,
      })
      return { ...result, attempts }
    } catch (error) {
      attempts.push({
        attempt,
        startedAt,
        finishedAt: nowIso(),
        status: "failed",
        message: error.message,
      })
      if (attempt >= maxAttempts) {
        error.attempts = attempts
        throw error
      }
      await sleep(options.retryDelayMs)
    }
  }

  throw new Error(`Fetch failed for ${urlOrPath}`)
}

function buildPagedConnectorUrl(urlOrPath, connectorType, pageIndex, pageSize) {
  const url = new URL(urlOrPath)
  if (connectorType === "socrata") {
    const limit = Number.parseInt(url.searchParams.get("$limit") ?? "", 10)
    const resolvedLimit = Number.isFinite(limit) ? limit : pageSize
    const baseOffset = Number.parseInt(
      url.searchParams.get("$offset") ?? "0",
      10
    )
    url.searchParams.set("$limit", String(resolvedLimit))
    url.searchParams.set(
      "$offset",
      String(
        (Number.isFinite(baseOffset) ? baseOffset : 0) +
          pageIndex * resolvedLimit
      )
    )
    return { url: url.toString(), pageSize: resolvedLimit }
  }

  if (connectorType === "ckan") {
    const rows = Number.parseInt(url.searchParams.get("rows") ?? "", 10)
    const resolvedRows = Number.isFinite(rows) ? rows : pageSize
    const baseStart = Number.parseInt(url.searchParams.get("start") ?? "0", 10)
    url.searchParams.set("rows", String(resolvedRows))
    url.searchParams.set(
      "start",
      String(
        (Number.isFinite(baseStart) ? baseStart : 0) + pageIndex * resolvedRows
      )
    )
    return { url: url.toString(), pageSize: resolvedRows }
  }

  const resultCount = Number.parseInt(
    url.searchParams.get("resultRecordCount") ?? "",
    10
  )
  const resolvedCount = Number.isFinite(resultCount) ? resultCount : pageSize
  const baseOffset = Number.parseInt(
    url.searchParams.get("resultOffset") ?? "0",
    10
  )
  url.searchParams.set("resultRecordCount", String(resolvedCount))
  url.searchParams.set(
    "resultOffset",
    String(
      (Number.isFinite(baseOffset) ? baseOffset : 0) + pageIndex * resolvedCount
    )
  )
  if (!url.searchParams.has("where")) url.searchParams.set("where", "1=1")
  if (!url.searchParams.has("outFields")) url.searchParams.set("outFields", "*")
  if (!url.searchParams.has("returnGeometry")) {
    url.searchParams.set("returnGeometry", "true")
  }
  if (!url.searchParams.has("outSR")) url.searchParams.set("outSR", "4326")
  url.searchParams.set("f", url.searchParams.get("f") ?? "json")
  return { url: url.toString(), pageSize: resolvedCount }
}

function readPagedRows(connectorType, parsed) {
  if (connectorType === "socrata") return Array.isArray(parsed) ? parsed : []
  if (connectorType === "arcgis") {
    return Array.isArray(parsed.features) ? parsed.features : []
  }
  return Array.isArray(parsed.result?.results) ? parsed.result.results : []
}

function hasNextPagedResponse(
  connectorType,
  parsed,
  rows,
  pageIndex,
  pageSize,
  totalRows = null
) {
  if (rows.length === 0) return false
  if (Number.isFinite(totalRows)) return (pageIndex + 1) * pageSize < totalRows
  if (connectorType === "arcgis") {
    return parsed.exceededTransferLimit === true
  }
  if (connectorType === "ckan") {
    const total = Number(parsed.result?.count)
    if (Number.isFinite(total)) return (pageIndex + 1) * pageSize < total
  }
  return rows.length >= pageSize
}

function mergePagedResponses(connectorType, pages) {
  const parsedPages = pages.map((page) => JSON.parse(page.rawText))
  if (connectorType === "socrata") {
    return JSON.stringify(
      parsedPages.flatMap((page) => (Array.isArray(page) ? page : []))
    )
  }
  if (connectorType === "arcgis") {
    const first = parsedPages[0] ?? {}
    return JSON.stringify({
      ...first,
      features: parsedPages.flatMap((page) =>
        Array.isArray(page.features) ? page.features : []
      ),
      pagination: {
        pagesFetched: pages.length,
        connectorType,
      },
    })
  }

  const first = parsedPages[0] ?? {}
  return JSON.stringify({
    ...first,
    result: {
      ...(first.result ?? {}),
      results: parsedPages.flatMap((page) =>
        Array.isArray(page.result?.results) ? page.result.results : []
      ),
    },
    pagination: {
      pagesFetched: pages.length,
      connectorType,
    },
  })
}

async function fetchPagedText(urlOrPath, source, options) {
  const connectorType = source.connectorType ?? source.connector_type
  const pagination = readPaginationOptions(source)
  if (
    resolveLocalPath(urlOrPath) ||
    !PAGED_CONNECTOR_TYPES.has(connectorType) ||
    pagination.maxPages <= 1
  ) {
    return fetchText(urlOrPath, source, options)
  }

  const pages = []
  const pageAttempts = []
  let resolvedPageSize = pagination.pageSize

  for (let pageIndex = 0; pageIndex < pagination.maxPages; pageIndex += 1) {
    const page = buildPagedConnectorUrl(
      urlOrPath,
      connectorType,
      pageIndex,
      resolvedPageSize
    )
    resolvedPageSize = page.pageSize
    const fetched = await fetchText(page.url, source, options)
    pages.push(fetched)
    pageAttempts.push(
      ...fetched.attempts.map((attempt) => ({
        ...attempt,
        page: pageIndex + 1,
        pageUrl: page.url,
      }))
    )

    let parsed
    try {
      parsed = JSON.parse(fetched.rawText)
    } catch {
      break
    }
    const rows = readPagedRows(connectorType, parsed)
    if (
      !hasNextPagedResponse(
        connectorType,
        parsed,
        rows,
        pageIndex,
        resolvedPageSize,
        pagination.totalRows
      )
    ) {
      break
    }
  }

  if (pages.length <= 1) {
    return {
      ...pages[0],
      attempts: pageAttempts.length ? pageAttempts : (pages[0]?.attempts ?? []),
      paginated: pages.length === 1,
      pagesFetched: pages.length,
    }
  }

  const rawText = mergePagedResponses(connectorType, pages)
  return {
    rawText,
    rawTextEncoding: "utf8",
    rawByteLength: Buffer.byteLength(rawText, "utf8"),
    contentType: "application/json",
    rawUrl: urlOrPath,
    statusCode: pages.at(-1)?.statusCode ?? 200,
    finalUrl: pages.at(-1)?.finalUrl ?? urlOrPath,
    fetchMethod: "GET",
    attempts: pageAttempts,
    paginated: true,
    pagesFetched: pages.length,
  }
}

function resolveBrowserUrl(urlOrPath) {
  const localPath = resolveLocalPath(urlOrPath)
  if (!localPath) return urlOrPath
  return toFileUrl(localPath)
}

async function fetchRenderedHtmlOnce(urlOrPath, source, options) {
  const playwrightOptions = readPlaywrightOptions(source)
  let browser = null

  try {
    const { chromium } = await import("@playwright/test")
    browser = await chromium.launch({
      headless: true,
      executablePath: playwrightOptions.executablePath ?? undefined,
    })
    const page = await browser.newPage()
    const finalUrl = resolveBrowserUrl(urlOrPath)
    const response = await page.goto(finalUrl, {
      waitUntil: playwrightOptions.waitUntil,
      timeout: options.timeoutMs,
    })
    if (playwrightOptions.waitForSelector) {
      await page.waitForSelector(playwrightOptions.waitForSelector, {
        timeout: options.timeoutMs,
      })
    }
    const rawText = await page.content()
    const statusCode = response?.status() ?? 200
    if (statusCode >= 400) {
      throw new Error(`Playwright fetch failed ${statusCode} for ${urlOrPath}`)
    }
    return {
      rawText,
      rawTextEncoding: "utf8",
      rawByteLength: Buffer.byteLength(rawText, "utf8"),
      contentType: "text/html",
      rawUrl: response?.url() ?? finalUrl,
      statusCode,
      finalUrl: response?.url() ?? finalUrl,
      renderingMode: "playwright",
      playwrightOptions: {
        waitUntil: playwrightOptions.waitUntil,
        waitForSelector: playwrightOptions.waitForSelector,
        executablePath: playwrightOptions.executablePath ? "custom" : null,
      },
    }
  } finally {
    if (browser) await browser.close()
  }
}

async function fetchRenderedHtml(urlOrPath, source, options) {
  const attempts = []
  const playwrightOptions = readPlaywrightOptions(source)
  const maxAttempts = options.retries + 1

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const startedAt = nowIso()
    try {
      const result = await fetchRenderedHtmlOnce(urlOrPath, source, options)
      attempts.push({
        attempt,
        startedAt,
        finishedAt: nowIso(),
        status: "success",
        statusCode: result.statusCode,
        finalUrl: result.finalUrl,
        renderingMode: "playwright",
      })
      return { ...result, attempts }
    } catch (error) {
      attempts.push({
        attempt,
        startedAt,
        finishedAt: nowIso(),
        status: "failed",
        message: error.message,
        renderingMode: "playwright",
      })
      if (attempt < maxAttempts) {
        await sleep(options.retryDelayMs)
        continue
      }

      if (playwrightOptions.required) {
        error.attempts = attempts
        throw error
      }

      const fallback = await fetchTextOnce(urlOrPath, source, options)
      return {
        ...fallback,
        contentType: "text/html",
        renderingMode: "static_fallback",
        playwrightOptions: {
          waitUntil: playwrightOptions.waitUntil,
          waitForSelector: playwrightOptions.waitForSelector,
          executablePath: playwrightOptions.executablePath ? "custom" : null,
        },
        renderError: error.message,
        attempts: [
          ...attempts,
          {
            attempt: attempt + 1,
            startedAt: nowIso(),
            finishedAt: nowIso(),
            status: "success",
            statusCode: fallback.statusCode,
            finalUrl: fallback.finalUrl,
            renderingMode: "static_fallback",
            fetchMethod: fallback.fetchMethod,
          },
        ],
      }
    }
  }

  throw new Error(`Playwright fetch failed for ${urlOrPath}`)
}

function assertConnectorType(type) {
  if (!CONNECTOR_TYPES.includes(type)) {
    throw new Error(`Unsupported connector type: ${type}`)
  }
}

function normalizeConnectorType(source) {
  const metadata = readMetadata(source)
  const type =
    source.connectorType ??
    source.connector_type ??
    metadata.connectorType ??
    "json"
  if (type === "rss") return "rss_atom"
  if (type === "html") return "static_html"
  if (type === "osm") return "osm_overpass"
  if (type === "wikidata") return "wikidata_sparql"
  return type
}

export async function runConnectorFetch(source, runId, options = {}) {
  const connectorType = normalizeConnectorType(source)
  assertConnectorType(connectorType)
  const url = buildDerivedUrl({ ...source, connectorType })
  if (!url)
    throw new Error(`Source ${source.name ?? source.slug} is missing a URL.`)
  const connectorOptions = readConnectorOptions(source, options)

  try {
    const fetched =
      connectorType === "playwright_scrape"
        ? await fetchRenderedHtml(url, source, connectorOptions)
        : await fetchPagedText(
            url,
            { ...source, connectorType },
            connectorOptions
          )
    return buildRawRecord({
      source: { ...source, connectorType },
      runId,
      rawUrl: fetched.rawUrl,
      rawText: fetched.rawText,
      contentType: fetched.contentType,
      metadata: {
        connectorOptions,
        fetchAttempts: fetched.attempts,
        fetchMethod: fetched.fetchMethod ?? "GET",
        paginated: fetched.paginated ?? false,
        pagesFetched: fetched.pagesFetched ?? 1,
        requestUrl: fetched.requestUrl,
        finalUrl: fetched.finalUrl,
        rawTextEncoding: fetched.rawTextEncoding,
        rawByteLength: fetched.rawByteLength,
        renderingMode: fetched.renderingMode ?? "direct_fetch",
        playwrightOptions: fetched.playwrightOptions,
        renderError: fetched.renderError,
        statusCode: fetched.statusCode,
      },
    })
  } catch (error) {
    return buildRawRecord({
      source: { ...source, connectorType },
      runId,
      rawUrl: url,
      rawText: "",
      contentType: inferContentType(url),
      status: "failed",
      errorMessage: error.message,
      metadata: {
        connectorOptions,
        fetchAttempts: error.attempts ?? [],
      },
    })
  }
}

export function parseFetchedRaw(rawRecord, source) {
  if (rawRecord.fetch_status !== "fetched") {
    return { records: [], warnings: [rawRecord.error_message].filter(Boolean) }
  }
  return parseRawPayload(rawRecord, source)
}
