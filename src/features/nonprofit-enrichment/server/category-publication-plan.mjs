import { DatabaseSync } from "node:sqlite"
import { existsSync, readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { randomUUID } from "node:crypto"
import { hash, stable, utc } from "./store.mjs"
import { privateWrite } from "./artifacts.mjs"
import {
  CATEGORY_MAPPING_VERSION,
  mapOrganizationCategories,
} from "./ntee-category-mapping.mjs"

export function planCategoryPublication({
  input,
  output,
  target,
  authorization,
  after = "",
  limit = 50000,
  retryFrom = null,
}) {
  if (
    !/^[a-z0-9]{20}$/.test(target ?? "") ||
    !authorization?.trim() ||
    authorization.length > 1000
  )
    throw new Error("Explicit target and authorization reference required")
  if (
    (after && !/^\d{9}$/.test(after)) ||
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > 100000
  )
    throw new Error("Invalid category plan bounds")
  if (existsSync(output)) throw new Error("Plan output must be new")
  const root = resolve(input)
  const reportText = readFileSync(join(root, "report.json"), "utf8")
  const report = JSON.parse(reportText)
  if (!report.complete || report.mappingVersion !== CATEGORY_MAPPING_VERSION)
    throw new Error("Completed matching category map required")
  const sourceHash = hash(reportText)
  const db = new DatabaseSync(join(root, "classifications.sqlite"), {
    readOnly: true,
  })
  const body = {
    kind: "nonprofit_category_plan_v1",
    batchId: randomUUID(),
    createdAt: utc(),
    target,
    authorization,
    mappingVersion: CATEGORY_MAPPING_VERSION,
    sourceHash,
    after,
    retryFrom,
    records: 0,
    chunks: [],
    lastEin: after,
  }
  try {
    db.exec("BEGIN")
    let pending = null
    if (retryFrom) {
      const previous = loadCategoryPlan(retryFrom)
      pending = []
      for (const chunk of previous.chunks) {
        const receipt = JSON.parse(
          readFileSync(
            join(retryFrom, "receipts", `${chunk.number}.json`),
            "utf8"
          )
        )
        if (receipt.manifestHash !== previous.manifestHash)
          throw new Error("Retry receipt manifest mismatch")
        pending.push(
          ...receipt.outcomes
            .filter((r) => r.status === "pending")
            .map((r) => r.ein)
        )
      }
      pending = [...new Set(pending)]
        .sort()
        .filter((ein) => ein > after)
        .slice(0, limit)
    }
    const byEin = db.prepare(
      "SELECT ein,raw_codes,categories FROM classifications WHERE ein=?"
    )
    const page = db.prepare(
      "SELECT ein,raw_codes,categories FROM classifications WHERE state='mapped' AND ein>? ORDER BY ein LIMIT ?"
    )
    while (body.records < limit) {
      const take = Math.min(250, limit - body.records)
      const rows = pending
        ? pending
            .slice(body.records, body.records + take)
            .map((ein) => byEin.get(ein))
        : page.all(body.lastEin, take)
      if (!rows.length) break
      const payload = rows.map((r) => {
        if (!r || !/^\d{9}$/.test(r.ein)) throw new Error("Missing mapped EIN")
        const decision = mapOrganizationCategories(JSON.parse(r.raw_codes))
        if (
          decision.state !== "mapped" ||
          stable(decision.categories) !== r.categories
        )
          throw new Error("Stored mapping differs from current rules")
        const recordText = stable({
          ein: r.ein,
          categories: decision.categories,
          mappingVersion: CATEGORY_MAPPING_VERSION,
          basis: "irs_classification",
          sourceHash,
        })
        return { ein: r.ein, recordText, recordDigest: hash(recordText) }
      })
      const text = stable(payload),
        number = body.chunks.length,
        file = `chunk-${String(number).padStart(6, "0")}.json`
      privateWrite(join(output, file), text)
      body.chunks.push({ number, file, hash: hash(text), records: rows.length })
      body.records += rows.length
      body.lastEin = rows.at(-1).ein
    }
    privateWrite(join(output, "mapping-report.json"), reportText)
    const plan = { ...body, manifestHash: hash(body) }
    privateWrite(join(output, "plan.json"), plan)
    return plan
  } finally {
    db.close()
  }
}

export function loadCategoryPlan(input) {
  const plan = JSON.parse(readFileSync(join(input, "plan.json"), "utf8"))
  const { manifestHash, ...body } = plan
  if (
    hash(body) !== manifestHash ||
    plan.kind !== "nonprofit_category_plan_v1" ||
    hash(readFileSync(join(input, "mapping-report.json"), "utf8")) !==
      plan.sourceHash
  )
    throw new Error("Category plan hash mismatch")
  let records = 0,
    lastEin = plan.after
  for (const [index, chunk] of plan.chunks.entries()) {
    if (
      chunk.number !== index ||
      chunk.file !== `chunk-${String(index).padStart(6, "0")}.json`
    )
      throw new Error("Invalid chunk path/sequence")
    const text = readFileSync(join(input, chunk.file), "utf8"),
      rows = JSON.parse(text)
    if (
      hash(text) !== chunk.hash ||
      rows.length !== chunk.records ||
      rows.length < 1 ||
      rows.length > 250
    )
      throw new Error("Category chunk changed")
    for (const row of rows) {
      if (
        !/^\d{9}$/.test(row.ein) ||
        row.ein <= lastEin ||
        hash(row.recordText) !== row.recordDigest ||
        JSON.parse(row.recordText).ein !== row.ein
      )
        throw new Error("Invalid category row order/digest")
      lastEin = row.ein
    }
    records += rows.length
  }
  if (records !== plan.records || lastEin !== plan.lastEin)
    throw new Error("Category population mismatch")
  return plan
}
