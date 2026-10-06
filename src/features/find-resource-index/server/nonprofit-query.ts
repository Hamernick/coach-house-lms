import { createHash } from "node:crypto"
import { z } from "zod"

const nullableText = z.string().nullable()
const basis = z.enum(["source_reported", "provider_confirmed"]).nullable()
export const directoryItemSchema = z
  .object({
    ein: z.string().regex(/^\d{9}$/),
    name: z.string().min(1).max(300),
    city: nullableText,
    state: nullableText,
    postalCode: nullableText,
    website: z
      .string()
      .url()
      .regex(/^https?:\/\//)
      .nullable(),
    phone: nullableText,
    description: z.string().max(1000).nullable(),
    websiteBasis: basis,
    phoneBasis: basis,
    websiteSourcePeriod: nullableText,
    phoneSourcePeriod: nullableText,
    descriptionSourcePeriod: nullableText,
    operatingStatus: z.literal("unknown"),
    listingType: z.literal("nonprofit_organization"),
  })
  .strict()

export const queryBinding = (query: string, state: string | null) =>
  createHash("sha256")
    .update(JSON.stringify([query, state]))
    .digest("hex")

export function parseDirectoryQuery(params: URLSearchParams) {
  const query = (params.get("q") ?? "").trim(),
    state = params.get("state")?.trim().toUpperCase() || null
  const rawLimit = params.get("limit") ?? "50"
  if (
    query.length > 160 ||
    (state !== null && !/^[A-Z]{2}$/.test(state)) ||
    !/^\d{1,3}$/.test(rawLimit)
  )
    throw new Error("Invalid directory query")
  const limit = Number(rawLimit)
  if (limit < 1 || limit > 100)
    throw new Error("Limit must be between 1 and 100")
  const binding = queryBinding(query, state),
    cursor = params.get("cursor")
  let after: string | null = null
  if (cursor) {
    if (cursor.length > 512 || !/^[A-Za-z0-9_-]+$/.test(cursor))
      throw new Error("Invalid cursor")
    const decoded = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8")
    )
    if (
      decoded.v !== 1 ||
      decoded.binding !== binding ||
      typeof decoded.after !== "string" ||
      !/^\d{9}$/.test(decoded.after)
    )
      throw new Error("Cursor does not match the query")
    after = decoded.after
  }
  return { query, state, limit, after, binding }
}

export function directoryCursor(after: string, binding: string) {
  return Buffer.from(JSON.stringify({ v: 1, after, binding })).toString(
    "base64url"
  )
}
