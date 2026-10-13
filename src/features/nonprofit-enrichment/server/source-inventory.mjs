import { statSync, realpathSync } from "node:fs"
import { basename } from "node:path"
import { fileHash } from "./import.mjs"
import { hash } from "./store.mjs"
import { readIrsEoCsvRows } from "../../../../scripts/resource-map/lib/irs-eo-acquisition.mjs"

export const BMF_REFERENCE =
  "https://www.irs.gov/charities-non-profits/exempt-organizations-business-master-file-extract-eo-bmf"
export const identityName = (name) =>
  String(name ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase()

export async function inspectSource(path, expected = null) {
  try {
    const resolved = realpathSync(path),
      before = statSync(resolved)
    if (!before.isFile()) throw new Error("not_regular_file")
    const sha256 = await fileHash(resolved),
      after = statSync(resolved)
    const changed =
      before.size !== after.size || before.mtimeMs !== after.mtimeMs
    return {
      path,
      resolvedPath: resolved,
      bytes: after.size,
      sha256,
      expectedSha256: expected,
      filesystemModifiedAt: after.mtime.toISOString(),
      integrity: changed
        ? "changed_during_hash"
        : expected && sha256 !== expected
          ? "hash_mismatch"
          : "matched",
    }
  } catch (error) {
    return {
      path,
      expectedSha256: expected,
      integrity: "unavailable",
      reason: error.code ?? error.message,
    }
  }
}

// Inventory only local files. A hash proves byte identity, not official download origin.
export async function inventorySources(db) {
  const sources = db.prepare("SELECT * FROM sources ORDER BY id").all()
  const files = new Map(),
    byId = new Map()
  for (const source of sources) {
    if (!files.has(source.path))
      files.set(source.path, await inspectSource(source.path))
    const file = files.get(source.path)
    const entry = {
      ...source,
      ...file,
      integrity:
        file.integrity === "matched" && file.sha256 !== source.sha256
          ? "hash_mismatch"
          : file.integrity,
      expectedSha256: source.sha256,
      reuseBasis: source.kind.startsWith("irs990")
        ? "IRS_public_filing_facts"
        : "identity_provenance_requires_BMF_join",
    }
    byId.set(source.id, entry)
  }
  return { entries: [...byId.values()], byId, uniqueFiles: files.size }
}

export async function matchBmfSources(inputs, wanted, matches = new Map()) {
  if (!inputs.length)
    throw new Error("Audit requires explicit local IRS BMF CSV --input paths")
  const snapshots = [],
    seenFiles = new Set()
  for (const input of inputs) {
    const snapshot = await inspectSource(input)
    if (snapshot.integrity !== "matched")
      throw new Error(`BMF source unavailable: ${input}`)
    if (seenFiles.has(snapshot.resolvedPath))
      throw new Error("Duplicate BMF input path")
    seenFiles.add(snapshot.resolvedPath)
    snapshot.kind = "irs_eo_bmf"
    snapshot.sourceUrl = BMF_REFERENCE
    snapshot.origin =
      "operator_supplied_local_IRS_format_snapshot; download_receipt_not_asserted"
    snapshot.reuseBasis =
      "IRS_published_registry_facts; excludes_third_party_assets"
    snapshot.snapshotDate = null
    snapshot.rows = 0
    snapshot.invalidRows = 0
    snapshot.matchedRows = 0
    snapshot.id = hash({ kind: snapshot.kind, sha256: snapshot.sha256 })
    for await (const row of readIrsEoCsvRows(snapshot.resolvedPath)) {
      snapshot.rows++
      if (
        !["EIN", "NAME", "STREET", "CITY", "STATE", "ZIP", "STATUS"].every(
          (k) => k in row
        )
      )
        throw new Error("BMF source lacks required columns")
      snapshot.columns ??= Object.keys(row)
      const ein = String(row.EIN ?? "").trim()
      if (
        !/^\d{9}$/.test(ein) ||
        ein === "000000000" ||
        !identityName(row.NAME)
      ) {
        snapshot.invalidRows++
        continue
      }
      if (wanted && !wanted.has(ein)) continue
      snapshot.matchedRows++
      const observation = {
        ein,
        name: identityName(row.NAME),
        inCareOf: row.ICO || null,
        address: {
          street: row.STREET,
          city: row.CITY,
          state: row.STATE,
          postalCode: row.ZIP,
        },
        statusCode: row.STATUS || null,
        taxPeriod: row.TAX_PERIOD || null,
        nteeCode: row.NTEE_CD || null,
        sourceId: snapshot.id,
        sourceFile: basename(snapshot.resolvedPath),
        sourceRow: snapshot.rows,
        rowHash: hash(row),
      }
      const list = matches.get(ein) ?? []
      // Bound pathological duplicate identities; overflow is held, never silently resolved.
      if (list.length < 51) list.push(observation)
      matches.set(ein, list)
    }
    if (!snapshot.rows) throw new Error("BMF CSV contains no data rows")
    if ((await fileHash(snapshot.resolvedPath)) !== snapshot.sha256)
      throw new Error(
        "BMF source changed while auditing; discard incomplete audit"
      )
    snapshots.push(snapshot)
  }
  return { matches, snapshots }
}
