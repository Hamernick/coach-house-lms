import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function readRoute(path: string) {
  return readFileSync(join(ROOT, path), "utf8")
}

function handler(source: string, method: "POST" | "DELETE") {
  const start = source.indexOf(`export async function ${method}`)
  const nextExport = source.indexOf("\nexport async function ", start + 1)
  return source.slice(start, nextExport === -1 ? undefined : nextExport)
}

describe("organization document write safety", () => {
  const documentRoute = readRoute("src/app/api/account/org-documents/route.ts")
  const policyRoute = readRoute("src/app/api/account/org-policies/route.ts")
  const policyDocumentRoute = readRoute(
    "src/app/api/account/org-policies/document/route.ts"
  )
  const publicDocumentRoute = readRoute(
    "src/app/api/account/org-public-documents/route.ts"
  )

  it("uses conflict-safe profile mutations instead of whole-profile upserts", () => {
    for (const source of [
      documentRoute,
      policyRoute,
      policyDocumentRoute,
      publicDocumentRoute,
    ]) {
      expect(source).toContain("mutateOrganizationProfile")
      expect(source).not.toContain(".upsert(")
    }
  })

  it("commits replacement metadata before removing any storage object", () => {
    for (const source of [
      documentRoute,
      policyDocumentRoute,
      publicDocumentRoute,
    ]) {
      const post = handler(source, "POST")
      const upload = post.indexOf(".upload(")
      const mutation = post.indexOf("mutateOrganizationProfile")
      const firstRemoval = post.indexOf(".remove(")

      expect(upload).toBeGreaterThan(-1)
      expect(mutation).toBeGreaterThan(upload)
      expect(firstRemoval).toBeGreaterThan(mutation)
    }
  })

  it("rolls back staged uploads when the profile mutation fails", () => {
    expect(handler(documentRoute, "POST")).toContain(".remove([objectName])")
    expect(handler(policyDocumentRoute, "POST")).toContain(
      ".remove([objectName])"
    )
    expect(handler(publicDocumentRoute, "POST")).toContain(
      ".remove([objectName])"
    )
  })

  it("commits delete metadata before storage cleanup", () => {
    for (const source of [
      documentRoute,
      policyRoute,
      policyDocumentRoute,
      publicDocumentRoute,
    ]) {
      const remove = handler(source, "DELETE")
      expect(remove.indexOf("mutateOrganizationProfile")).toBeLessThan(
        remove.indexOf(".remove(")
      )
    }
  })
})
