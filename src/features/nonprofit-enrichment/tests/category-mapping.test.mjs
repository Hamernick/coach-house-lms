import { test } from "node:test"
import assert from "node:assert/strict"
import {
  mkdtempSync,
  writeFileSync,
  readFileSync,
  rmSync,
  existsSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { DatabaseSync } from "node:sqlite"
import {
  mapNteeCategory,
  mapOrganizationCategories,
  CATEGORY_REFERENCE,
  CATEGORY_NAVIGATION_ADDITIONS,
  NTEE_TOPIC_OVERRIDES,
} from "../server/ntee-category-mapping.mjs"
import { mapCategoryCorpus } from "../server/category-corpus.mjs"

test("known NTEE families map to topics without inventing service availability", () => {
  const expected = {
    A99: "arts",
    B99: "education",
    C99: "environment",
    D99: "animals",
    E99: "health",
    F99: "health",
    G99: "health",
    H99: "health",
    I99: "legal",
    J99: "employment",
    K99: "food",
    L99: "housing",
    M99: "emergency",
    N99: "recreation",
    O99: "family",
    P99: "community",
    Q99: "international",
    R99: "legal",
    S99: "community",
    T99: "philanthropy",
    W99: "community",
    X99: "faith",
  }
  for (const [code, category] of Object.entries(expected)) {
    const result = mapNteeCategory(code)
    assert.ok(result.categories.includes(category), code)
    assert.equal(result.provesServices, false)
    assert.equal(result.scope, "organization_topic")
  }
  for (const code of ["K31", "K35", "H30", "X20", "T20"]) {
    const result = mapNteeCategory(code)
    assert.ok(
      result.categories.every((c) => !c.includes("_")),
      code
    )
  }
  assert.deepEqual(mapNteeCategory("P43").categories, [
    "family",
    "housing",
    "safety",
  ])
  assert.deepEqual(mapNteeCategory("P51").categories, ["finance"])
  assert.deepEqual(mapNteeCategory("S50").categories, ["organizations"])
})

test("normalizes case and permitted suffixes, preserves unknowns and conflicts", () => {
  for (const [raw, normalized] of [
    [" k31 ", "K31"],
    ["G9B", "G9B"],
    ["n6a", "N6A"],
    ["P203", "P203"],
  ]) {
    const result = mapNteeCategory(raw)
    assert.equal(result.normalizedCode, normalized)
    assert.equal(result.state, "mapped")
    assert.equal(result.rawCode, raw)
  }
  for (const [code, reason] of [
    [null, "missing_ntee"],
    ["  ", "missing_ntee"],
    ["Z99", "irs_unknown"],
    ["U20", "no_equivalent_topic"],
    ["V20", "no_equivalent_topic"],
    ["Y20", "no_equivalent_topic"],
    ["K9999", "malformed_ntee"],
    ["0", "malformed_ntee"],
    ["K$$", "malformed_ntee"],
    ["A00", "unrecognized_core_code"],
  ]) {
    assert.equal(mapNteeCategory(code).reason, reason, code)
    assert.deepEqual(mapNteeCategory(code).categories, [])
  }
  assert.equal(mapOrganizationCategories(["k31", " K31 "]).state, "mapped")
  assert.equal(
    mapOrganizationCategories(["K31", "L41"]).reason,
    "conflicting_source_codes"
  )
  assert.deepEqual(mapOrganizationCategories(["K31", null]).categories, [])
})

test("mapping targets and compatibility leaves agree with current registry or explicit navigation proposal", () => {
  const registry = readFileSync(
    new URL("../../../lib/public-map/resource-categories.ts", import.meta.url),
    "utf8"
  )
  const existing = new Set(
    [...registry.matchAll(/"([a-z][a-z_]+)"/g)].map((m) => m[1])
  )
  for (const code of Object.keys(NTEE_TOPIC_OVERRIDES))
    assert.ok(CATEGORY_REFERENCE.codes.includes(code), code)
  for (const code of CATEGORY_REFERENCE.codes)
    for (const key of mapNteeCategory(code).categories)
      assert.ok(
        existing.has(key) || Object.hasOwn(CATEGORY_NAVIGATION_ADDITIONS, key),
        key
      )
  for (const proposal of Object.values(CATEGORY_NAVIGATION_ADDITIONS))
    for (const key of proposal.existingLeaves) assert.ok(existing.has(key), key)
})

test("disk-backed corpus mapping resumes, deduplicates EINs, retains conflicts and rejects changed snapshots", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "nonprofit-categories-"))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const a = join(root, "a.csv"),
    b = join(root, "b.csv"),
    output = join(root, "run")
  writeFileSync(a, "EIN,NTEE_CD\n123456789,K31\n123456790,\n123456791,P43\n")
  writeFileSync(b, "EIN,NTEE_CD\n123456789,L41\n123456792,G9B\n")
  const first = await mapCategoryCorpus({ inputs: [a, b], output, limit: 2 })
  assert.equal(first.complete, false)
  assert.equal(first.organizations, 2)
  assert.equal(existsSync(join(output, "report.json")), false)
  const result = await mapCategoryCorpus({ inputs: [b, a], output, all: true })
  assert.equal(result.complete, true)
  assert.equal(result.organizations, 4)
  assert.equal(result.inputRows, 5)
  assert.equal(result.duplicateRows, 1)
  assert.equal(result.mapped, 2)
  assert.equal(result.unclassified, 2)
  assert.deepEqual(result.categoryCounts, {
    family: 1,
    health: 1,
    housing: 1,
    safety: 1,
  })
  assert.equal(result.reasonCounts.conflicting_source_codes, 1)
  const db = new DatabaseSync(result.database, { readOnly: true })
  const row = db
    .prepare(
      "SELECT source_refs,categories FROM classifications WHERE ein='123456789'"
    )
    .get()
  db.close()
  assert.equal(JSON.parse(row.source_refs).length, 2)
  assert.equal(row.categories, "[]")
  const replay = await mapCategoryCorpus({ inputs: [a, b], output, all: true })
  assert.equal(replay.replayed, true)
  assert.equal(replay.organizations, 4)
  writeFileSync(a, readFileSync(a, "utf8") + "123456793,X20\n")
  await assert.rejects(
    mapCategoryCorpus({ inputs: [a, b], output, all: true }),
    /changed/
  )
})

test("bad identities roll back their active batch and duplicate input content is rejected", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "nonprofit-category-invalid-"))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const a = join(root, "a.csv"),
    b = join(root, "b.csv")
  writeFileSync(a, "EIN,NTEE_CD\n123456789,K31\nbad,X20\n")
  await assert.rejects(
    mapCategoryCorpus({
      inputs: [a],
      output: join(root, "invalid"),
      all: true,
    }),
    /valid EIN/
  )
  writeFileSync(b, readFileSync(a))
  await assert.rejects(
    mapCategoryCorpus({
      inputs: [a, b],
      output: join(root, "duplicates"),
      all: true,
    }),
    /Duplicate source/
  )
})
