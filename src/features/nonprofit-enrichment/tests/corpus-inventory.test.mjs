import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { inventoryCorpus } from "../server/corpus-inventory.mjs"

const header = "EIN,NAME,STREET,CITY,STATE,ZIP,STATUS\n"
test("full inventory reconciles duplicate EINs, disagreements and rejected rows", async () => {
  const dir = mkdtempSync(join(tmpdir(), "corpus-test-"))
  try {
    const a = join(dir, "a.csv"),
      b = join(dir, "b.csv")
    const first = '012345678,"Food, Center",123 Main,Town,IL,60000,01\n'
    writeFileSync(
      a,
      header +
        first +
        "123456789,Other,123 Main,Town,IL,60000,01\n000000000,Bad,,,,,\n012345679,,,,,,\n"
    )
    writeFileSync(
      b,
      header + first + "123456789,Changed,Other,Town,IL,60000,01\n"
    )
    const result = await inventoryCorpus([a, b])
    assert.equal(result.totals.inputRows, 6)
    assert.equal(result.totals.acceptedRows, 4)
    assert.equal(result.totals.rejectedRows, 2)
    assert.equal(result.totals.uniqueEins, 2)
    assert.equal(result.totals.duplicateRows, 2)
    assert.equal(result.totals.repeatedEins, 2)
    assert.equal(result.totals.differingNameEins, 1)
    assert.equal(result.totals.differingRowEins, 1)
    assert.equal(result.sources[0].rejectedReasons.invalid_ein, 1)
    assert.equal(result.sources[0].rejectedReasons.missing_name, 1)
    assert.equal(result.researchLedgerWrites, 0)
    assert.equal(
      (await inventoryCorpus([b, a])).corpusDigest,
      result.corpusDigest
    )
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
test("inventory rejects repeated paths and missing schema instead of counting fake coverage", async () => {
  const dir = mkdtempSync(join(tmpdir(), "corpus-test-"))
  try {
    const a = join(dir, "a.csv")
    writeFileSync(a, header + "012345678,Name,Main,Town,IL,60000,01\n")
    await assert.rejects(inventoryCorpus([a, a]), /Duplicate/)
    writeFileSync(a, "EIN,NAME\n012345678,Name\n")
    await assert.rejects(inventoryCorpus([a]), /columns/)
    writeFileSync(a, header)
    await assert.rejects(inventoryCorpus([a]), /Empty/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
