import { randomUUID } from "node:crypto"

const RETRIABLE_FETCH_ERROR_CODES = new Set([
  "ECONNRESET",
  "EPIPE",
  "UND_ERR_SOCKET",
])

function isRetriableFetchError(error) {
  const message = String(error?.message ?? "")
  const details = String(error?.details ?? "")
  const errorText = `${message}\n${details}`
  const errorCodes = [error?.code, error?.cause?.code].filter(Boolean)

  if (!errorText.toLowerCase().includes("fetch failed")) return false
  if (
    [...RETRIABLE_FETCH_ERROR_CODES].some((code) => errorText.includes(code))
  ) {
    return true
  }

  return (
    errorCodes.length === 0 ||
    errorCodes.some((code) => RETRIABLE_FETCH_ERROR_CODES.has(code))
  )
}

function wait(delayMs) {
  return delayMs > 0
    ? new Promise((resolve) => setTimeout(resolve, delayMs))
    : Promise.resolve()
}

async function countInsertedEvidence(admin, evidenceIds, maxAttempts) {
  let lastError = null

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const { count, error } = await admin
        .from("resource_map_field_evidence")
        .select("id", { count: "exact", head: true })
        .in("id", evidenceIds)

      if (error) throw error
      return count ?? 0
    } catch (error) {
      lastError = error
      if (!isRetriableFetchError(error) || attempt === maxAttempts) throw error
      await wait(100 * attempt)
    }
  }

  throw lastError
}

export async function insertPromotedFieldEvidenceRows({
  admin,
  rows,
  maxAttempts = 3,
  retryDelayMs = 250,
}) {
  if (rows.length === 0) return 0
  const rowsWithIds = rows.map((row) => ({
    ...row,
    id: row.id ?? randomUUID(),
  }))
  const evidenceIds = rowsWithIds.map((row) => row.id)

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const { error } = await admin
        .from("resource_map_field_evidence")
        .upsert(rowsWithIds, { onConflict: "id", ignoreDuplicates: true })
      if (error) throw error
      return rows.length
    } catch (error) {
      if (!isRetriableFetchError(error)) throw error

      const insertedCount = await countInsertedEvidence(
        admin,
        evidenceIds,
        maxAttempts
      )
      if (insertedCount === rows.length) return rows.length
      if (insertedCount !== 0) {
        throw new Error(
          `Promotion evidence insert left ${insertedCount} of ${rows.length} rows.`
        )
      }
      if (attempt === maxAttempts) throw error
      await wait(retryDelayMs * attempt)
    }
  }

  return 0
}
