import { readFileSync } from "node:fs"

function readWrappedRecords(parsed) {
  if (Array.isArray(parsed)) return parsed
  if (!parsed || typeof parsed !== "object") return []
  if (Array.isArray(parsed.records)) return parsed.records
  if (Array.isArray(parsed.resources)) return parsed.resources
  if (Array.isArray(parsed.items)) return parsed.items
  return [parsed]
}

export function parseResourceMapRecords(raw, { label = "input" } = {}) {
  const trimmed = raw.trim()
  if (!trimmed) return []

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      return readWrappedRecords(JSON.parse(trimmed))
    } catch (error) {
      if (!trimmed.includes("\n")) {
        throw new Error(
          `Invalid resource record JSON in ${label}: ${error.message}`
        )
      }
    }
  }

  return trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line)
      } catch (error) {
        throw new Error(
          `Invalid resource record JSONL in ${label} at line ${index + 1}: ${
            error.message
          }`
        )
      }
    })
}

export function readResourceMapRecords(filePath) {
  return parseResourceMapRecords(readFileSync(filePath, "utf8"), {
    label: filePath,
  })
}
