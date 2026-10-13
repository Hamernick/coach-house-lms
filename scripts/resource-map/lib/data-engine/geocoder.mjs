import {
  STORE_PATHS,
  nowIso,
  readString,
  readJsonl,
  sha256,
  upsertJsonl,
} from "./shared.mjs"

const DEFAULT_GEOCODE_TIMEOUT_MS = 8_000
const DEFAULT_GEOCODE_PROVIDER_DELAY_MS = 1_000

function readFields(record) {
  return record.extractedFields ?? record.extracted_fields ?? {}
}

function readEvidence(record) {
  const value = record.fieldEvidence ?? record.field_evidence
  return Array.isArray(value) ? value : []
}

function appendGeocodeEvidence(record, fields, entries) {
  const sourceUrl = readString(
    record.sourceUrl,
    record.source_url,
    fields.sourceUrl
  )
  const observedAt = record.lastScrapedAt ?? record.last_scraped_at ?? nowIso()
  const fieldEvidence = [
    ...readEvidence(record),
    ...entries.map((entry) => ({
      fieldPath: entry.fieldPath,
      fieldValue: entry.fieldValue,
      confidenceScore: entry.confidenceScore,
      sourceUrl,
      observedAt,
      evidenceType: entry.evidenceType ?? "derived",
      derivedFrom: entry.derivedFrom ?? [],
      transformation: entry.transformation ?? "geocode_resource_location",
    })),
  ]

  return {
    ...record,
    fieldEvidence,
  }
}

function buildAddress(fields) {
  const parts = [
    fields.addressLine1 ?? fields.address,
    fields.city,
    fields.state,
    fields.postalCode,
  ]
    .filter(Boolean)
    .join(", ")

  return readString(fields.fullAddress, parts, fields.address)
}

function readCoordinate(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  const parsed = Number.parseFloat(String(value ?? ""))
  return Number.isFinite(parsed) ? parsed : null
}

function readArrayField(value) {
  if (Array.isArray(value)) return value.filter((entry) => readString(entry))
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/[;,|]/u)
      .map((entry) => entry.trim())
      .filter(Boolean)
  }
  return []
}

function readServiceArea(fields) {
  return readArrayField(fields.serviceArea ?? fields.service_area)
}

function loadCache() {
  return new Map(
    readJsonl(STORE_PATHS.geocodeCache).map((row) => [row.key, row])
  )
}

function normalizeInteger(value, fallback, min, max) {
  const parsed = Number.parseInt(String(value ?? fallback), 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(parsed, min), max)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function withTimeout(promise, timeoutMs, message) {
  let timeout = null
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new Error(message)), timeoutMs)
      }),
    ])
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}

async function fetchJsonWithTimeout(url, { timeoutMs, headers }) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      headers,
      signal: controller.signal,
    })
    if (!response.ok) return null
    return await response.json()
  } finally {
    clearTimeout(timeout)
  }
}

async function censusGeocode(address, options = {}) {
  const url = new URL(
    "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress"
  )
  url.searchParams.set("address", address)
  url.searchParams.set("benchmark", "Public_AR_Current")
  url.searchParams.set("format", "json")
  const body = await fetchJsonWithTimeout(url, {
    timeoutMs: options.timeoutMs,
    headers: { "User-Agent": "coach-house-resource-map-local-prototype" },
  })
  const match = body?.result?.addressMatches?.[0]
  if (!match?.coordinates) return null
  return {
    latitude: match.coordinates.y,
    longitude: match.coordinates.x,
    geocodingAccuracy: "street",
    provider: "census",
    confidence: 82,
  }
}

async function nominatimGeocode(address, options = {}) {
  const url = new URL("https://nominatim.openstreetmap.org/search")
  url.searchParams.set("q", address)
  url.searchParams.set("format", "jsonv2")
  url.searchParams.set("limit", "1")
  const body = await fetchJsonWithTimeout(url, {
    timeoutMs: options.timeoutMs,
    headers: {
      "User-Agent": "coach-house-resource-map-local-prototype/1.0",
    },
  })
  const match = Array.isArray(body) ? body[0] : null
  if (!match) return null
  return {
    latitude: Number.parseFloat(match.lat),
    longitude: Number.parseFloat(match.lon),
    geocodingAccuracy: "unknown",
    provider: "nominatim",
    confidence: 70,
  }
}

async function callGeocoderProvider(provider, address, options) {
  try {
    const result = await withTimeout(
      provider.geocode(address, options),
      options.timeoutMs,
      `${provider.name} geocoder timed out after ${options.timeoutMs}ms`
    )
    return { result, error: null }
  } catch (error) {
    return {
      result: null,
      error: {
        provider: provider.name,
        message: error.message,
      },
    }
  }
}

export async function resolveNetworkGeocode(
  address,
  { geocoders = null, timeoutMs, providerDelayMs } = {}
) {
  const providers = geocoders ?? [
    { name: "census", geocode: censusGeocode },
    { name: "nominatim", geocode: nominatimGeocode },
  ]
  const errors = []

  for (const [index, provider] of providers.entries()) {
    if (index > 0 && providerDelayMs > 0) await sleep(providerDelayMs)
    const { result, error } = await callGeocoderProvider(provider, address, {
      timeoutMs,
    })
    if (error) errors.push(error)
    if (result) return { result, errors }
  }

  return { result: null, errors }
}

export async function geocodeRecord(
  record,
  {
    network = false,
    geocodeTimeoutMs = DEFAULT_GEOCODE_TIMEOUT_MS,
    geocodeProviderDelayMs = DEFAULT_GEOCODE_PROVIDER_DELAY_MS,
    geocoders = null,
  } = {}
) {
  const fields = { ...readFields(record) }
  const latitude = readCoordinate(fields.latitude)
  const longitude = readCoordinate(fields.longitude)
  if (latitude !== null && longitude !== null) {
    const valid =
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180 &&
      !(latitude === 0 && longitude === 0)
    if (!valid) {
      return {
        ...appendGeocodeEvidence(record, fields, [
          {
            fieldPath: "extractedFields.geocodingAccuracy",
            fieldValue: "invalid_source_coordinates",
            confidenceScore: 0,
            evidenceType: "source",
            derivedFrom: [
              "extractedFields.latitude",
              "extractedFields.longitude",
            ],
            transformation: "validate_source_coordinates",
          },
          {
            fieldPath: "extractedFields.geocodingConfidence",
            fieldValue: 0,
            confidenceScore: 0,
            derivedFrom: [
              "extractedFields.latitude",
              "extractedFields.longitude",
            ],
            transformation: "validate_source_coordinates",
          },
        ]),
        extractedFields: {
          ...fields,
          latitude: null,
          longitude: null,
          geocodingAccuracy: "invalid_source_coordinates",
          geocodingConfidence: 0,
        },
      }
    }

    return {
      ...appendGeocodeEvidence(record, fields, [
        {
          fieldPath: "extractedFields.latitude",
          fieldValue: latitude,
          confidenceScore: 100,
          evidenceType: "source",
          derivedFrom: ["extractedFields.latitude"],
          transformation: "source_coordinate_preserved",
        },
        {
          fieldPath: "extractedFields.longitude",
          fieldValue: longitude,
          confidenceScore: 100,
          evidenceType: "source",
          derivedFrom: ["extractedFields.longitude"],
          transformation: "source_coordinate_preserved",
        },
        {
          fieldPath: "extractedFields.geocodingProvider",
          fieldValue: "source",
          confidenceScore: 100,
          evidenceType: "source",
          derivedFrom: [
            "extractedFields.latitude",
            "extractedFields.longitude",
          ],
          transformation: "source_coordinate_preserved",
        },
        {
          fieldPath: "extractedFields.geocodingConfidence",
          fieldValue: 100,
          confidenceScore: 100,
          evidenceType: "source",
          derivedFrom: [
            "extractedFields.latitude",
            "extractedFields.longitude",
          ],
          transformation: "source_coordinate_preserved",
        },
      ]),
      extractedFields: {
        ...fields,
        latitude,
        longitude,
        geocodingAccuracy: fields.geocodingAccuracy ?? "source",
        geocodingProvider: "source",
        geocodingConfidence: 100,
      },
    }
  }

  const locationType = readString(fields.locationType)
  if (locationType === "online" || fields.onlineOnly === true) {
    return {
      ...appendGeocodeEvidence(record, fields, [
        {
          fieldPath: "extractedFields.locationType",
          fieldValue: "online",
          confidenceScore: 100,
          derivedFrom: [
            "extractedFields.locationType",
            "extractedFields.onlineOnly",
          ],
          transformation: "classify_online_only_location",
        },
        {
          fieldPath: "extractedFields.geocodingAccuracy",
          fieldValue: "not_applicable",
          confidenceScore: 100,
          derivedFrom: [
            "extractedFields.locationType",
            "extractedFields.onlineOnly",
          ],
          transformation: "classify_online_only_location",
        },
      ]),
      extractedFields: {
        ...fields,
        locationType: "online",
        geocodingAccuracy: "not_applicable",
        geocodingConfidence: 100,
      },
    }
  }

  const serviceArea = readServiceArea(fields)
  if (locationType === "service_area" || serviceArea.length > 0) {
    return {
      ...appendGeocodeEvidence(record, fields, [
        {
          fieldPath: "extractedFields.locationType",
          fieldValue: "service_area",
          confidenceScore: 85,
          derivedFrom: [
            "extractedFields.locationType",
            "extractedFields.serviceArea",
          ],
          transformation: "classify_service_area_only_location",
        },
        {
          fieldPath: "extractedFields.geocodingAccuracy",
          fieldValue: "service_area_only",
          confidenceScore: 85,
          derivedFrom: [
            "extractedFields.locationType",
            "extractedFields.serviceArea",
          ],
          transformation: "classify_service_area_only_location",
        },
        {
          fieldPath: "extractedFields.geocodingConfidence",
          fieldValue: 85,
          confidenceScore: 85,
          derivedFrom: [
            "extractedFields.locationType",
            "extractedFields.serviceArea",
          ],
          transformation: "classify_service_area_only_location",
        },
      ]),
      extractedFields: {
        ...fields,
        serviceArea,
        locationType: "service_area",
        geocodingAccuracy: "service_area_only",
        geocodingConfidence: 85,
      },
    }
  }

  const address = buildAddress(fields)
  if (!address) {
    return {
      ...appendGeocodeEvidence(record, fields, [
        {
          fieldPath: "extractedFields.geocodingAccuracy",
          fieldValue: "not_attempted",
          confidenceScore: 0,
          derivedFrom: ["extractedFields.address"],
          transformation: "missing_address_geocode_skip",
        },
        {
          fieldPath: "extractedFields.geocodingConfidence",
          fieldValue: 0,
          confidenceScore: 0,
          derivedFrom: ["extractedFields.address"],
          transformation: "missing_address_geocode_skip",
        },
      ]),
      extractedFields: {
        ...fields,
        geocodingAccuracy: "not_attempted",
        geocodingConfidence: 0,
      },
    }
  }

  const key = sha256(address.toLowerCase())
  const cache = loadCache()
  let cached = cache.get(key)
  let geocodingErrors = []
  if (!cached && network) {
    const resolved = await resolveNetworkGeocode(address, {
      geocoders,
      timeoutMs: normalizeInteger(
        geocodeTimeoutMs,
        DEFAULT_GEOCODE_TIMEOUT_MS,
        100,
        60_000
      ),
      providerDelayMs: normalizeInteger(
        geocodeProviderDelayMs,
        DEFAULT_GEOCODE_PROVIDER_DELAY_MS,
        0,
        60_000
      ),
    })
    const result = resolved.result
    geocodingErrors = resolved.errors
    if (result) {
      cached = {
        key,
        address,
        ...result,
        observedAt: nowIso(),
      }
      upsertJsonl(STORE_PATHS.geocodeCache, [cached], (row) => row.key)
    }
  }

  if (!cached) {
    const errorEvidence = geocodingErrors.length
      ? [
          {
            fieldPath: "extractedFields.geocodingErrors",
            fieldValue: geocodingErrors,
            confidenceScore: 0,
            derivedFrom: [
              "extractedFields.address",
              "extractedFields.city",
              "extractedFields.state",
              "extractedFields.postalCode",
            ],
            transformation: "geocode_provider_errors",
          },
        ]
      : []

    return {
      ...appendGeocodeEvidence(record, fields, [
        {
          fieldPath: "extractedFields.geocodingAccuracy",
          fieldValue: network ? "failed" : "not_attempted",
          confidenceScore: 0,
          derivedFrom: [
            "extractedFields.address",
            "extractedFields.city",
            "extractedFields.state",
            "extractedFields.postalCode",
          ],
          transformation: network
            ? "geocode_failed"
            : "network_geocode_disabled",
        },
        {
          fieldPath: "extractedFields.geocodingConfidence",
          fieldValue: 0,
          confidenceScore: 0,
          derivedFrom: [
            "extractedFields.address",
            "extractedFields.city",
            "extractedFields.state",
            "extractedFields.postalCode",
          ],
          transformation: network
            ? "geocode_failed"
            : "network_geocode_disabled",
        },
        ...errorEvidence,
      ]),
      extractedFields: {
        ...fields,
        ...(geocodingErrors.length ? { geocodingErrors } : {}),
        geocodingAccuracy: network ? "failed" : "not_attempted",
        geocodingConfidence: 0,
      },
    }
  }

  return {
    ...appendGeocodeEvidence(record, fields, [
      {
        fieldPath: "extractedFields.latitude",
        fieldValue: cached.latitude,
        confidenceScore: cached.confidence,
        derivedFrom: [
          "extractedFields.address",
          "extractedFields.city",
          "extractedFields.state",
          "extractedFields.postalCode",
        ],
        transformation: `geocode_${cached.provider}`,
      },
      {
        fieldPath: "extractedFields.longitude",
        fieldValue: cached.longitude,
        confidenceScore: cached.confidence,
        derivedFrom: [
          "extractedFields.address",
          "extractedFields.city",
          "extractedFields.state",
          "extractedFields.postalCode",
        ],
        transformation: `geocode_${cached.provider}`,
      },
      {
        fieldPath: "extractedFields.geocodingProvider",
        fieldValue: cached.provider,
        confidenceScore: cached.confidence,
        derivedFrom: ["data/resource-map/.engine/geocode-cache.jsonl"],
        transformation: "geocode_cache_lookup",
      },
      {
        fieldPath: "extractedFields.geocodingConfidence",
        fieldValue: cached.confidence,
        confidenceScore: cached.confidence,
        derivedFrom: ["data/resource-map/.engine/geocode-cache.jsonl"],
        transformation: "geocode_cache_lookup",
      },
    ]),
    extractedFields: {
      ...fields,
      latitude: cached.latitude,
      longitude: cached.longitude,
      geocodingAccuracy: cached.geocodingAccuracy,
      geocodingProvider: cached.provider,
      geocodingConfidence: cached.confidence,
    },
  }
}
