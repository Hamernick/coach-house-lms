import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { openStore, hash, stable } from "../server/store.mjs"
import { importIdentities } from "../server/import.mjs"
import { ingestFilings } from "../server/filings.mjs"
import { prepareFilingUpdates } from "../server/prepare-filing-updates.mjs"
import { planFilingUpdates, fillMissingFilingFields } from "../server/filing-update-plan.mjs"
import { AUDIT_POLICY } from "../server/publication-policy.mjs"
import { reportedWebsite } from "../server/publication-policy.mjs"
import { loadPublicationPlan } from "../server/publisher.mjs"

const ein = "012345678", target = "abcdefghijklmnopqrst"
const field = (value) => ({ eligible: true, value, basis: "source_reported", sourcePeriod: "2025-12-31" })

test("missing-field updates preserve identity, existing contacts, dates and provider confirmation", () => {
  const original = { ein, name: "Name", city: "Chicago", website: "https://kept.org/",
    websiteBasis: "provider_confirmed", websiteSourcePeriod: "2024-12-31",
    phone: null, description: "Existing description" }
  const { record, added } = fillMissingFilingFields(original, {
    website: field("https://new.org/"), phone: field("+17735551212"), description: field("Different text") })
  assert.deepEqual(added, ["phone"])
  assert.deepEqual(record, { ...original, phone: "+17735551212", phoneBasis: "source_reported", phoneSourcePeriod: "2025-12-31" })
  assert.equal(original.phone, null)
  assert.throws(() => fillMissingFilingFields({ phone: null }, { phone: { ...field("123"), basis: "provider_confirmed" } }), /Invalid/)
})

test("malformed filing URLs never block independent phones or descriptions", () => {
  for (const website of ["https://./", "https://www.//PORTAL.CLUBRUNNER.CA/3707", "https://a..org/", "https://a.org/" + "x".repeat(2048)]) {
    assert.equal(reportedWebsite(website), null)
    const result = fillMissingFilingFields({ website: null, phone: null, description: null }, {
      website: field(website), phone: field("+17735551212"), description: field("Supported mission") })
    assert.equal(result.record.website, null)
    assert.deepEqual(result.added, ["phone", "description"])
  }
})

async function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "filing-deltas-"))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const identity = join(root, "identities.jsonl"), state = join(root, "state")
  writeFileSync(identity, stable({ ein, organizationName: "Example community" }) + "\n")
  const db = openStore(state, { write: true })
  await importIdentities(db, [identity], { all: true })
  const xml = join(root, "return.xml")
  const body = `<Return><ReturnHeader><Filer><EIN>${ein}</EIN></Filer><TaxYr>2025</TaxYr><TaxPeriodEndDt>2025-12-31</TaxPeriodEndDt></ReturnHeader><ReturnData><IRS990><WebsiteAddressTxt>communityfood.org</WebsiteAddressTxt><PhoneNum>7735551212</PhoneNum><MissionDesc>Community food assistance.</MissionDesc></IRS990></ReturnData></Return>`
  writeFileSync(xml, body)
  writeFileSync(join(root, "return.source.json"), stable({ ein, xml_sha256: hash(body), source_url: "https://apps.irs.gov/pub/epostcard/990/xml/2026/a.zip#a.xml" }))
  await ingestFilings(db, [xml]); db.close()
  return { root, state, xml }
}

test("affected-EIN assessment uses real XML/evidence, persists no ledger changes and holds changed/quarantined sources", async (t) => {
  const { root, state, xml } = await fixture(t), db = openStore(state)
  t.after(() => db.close())
  const before = readFileSync(join(state, "research.sqlite"))
  const report = await prepareFilingUpdates(db, { output: join(root, "first") })
  assert.equal(report.selected, 1); assert.equal(report.records, 1)
  assert.deepEqual(report.fields, { website: 1, phone: 1, description: 1 })
  const delta = JSON.parse(readFileSync(join(root, "first", "updates.jsonl")))
  assert.equal(delta.fields.website.basis, "source_reported")
  assert.equal(delta.fields.phone.value, "+17735551212")
  assert.deepEqual(readFileSync(join(state, "research.sqlite")), before)
  const excluded = await prepareFilingUpdates(db, { output: join(root, "excluded"), excludeEins: [ein] })
  assert.equal(excluded.records, 0); assert.equal(excluded.holds.source_integrity, 1)
  writeFileSync(xml, "changed")
  const invalid = await prepareFilingUpdates(db, { output: join(root, "changed") })
  assert.equal(invalid.records, 0); assert.equal(invalid.sourceFailures, 1)
})

test("field plans bind merges to previous digests, hold changed/owned/missing rows and reject changed artifacts", async (t) => {
  const { root, state } = await fixture(t), db = openStore(state)
  t.after(() => db.close())
  const input = join(root, "assessment")
  await prepareFilingUpdates(db, { output: input })
  const content = { ein, name: "Canonical name", city: "Original city", website: null,
    phone: "+13125551212", description: null, phoneBasis: "provider_confirmed", phoneSourcePeriod: "2024-12-31" }
  const existing = { ein, content, record_digest: hash(content), managed_by: "import", suppressed_at: null }
  let expected = existing.record_digest, hold = null
  const client = { async rpc(name, args) {
    assert.equal(name, "nonprofit_directory_preflight"); assert.deepEqual(args.p_eins, [ein])
    return { settings: { target_ref: target, policy_version: AUDIT_POLICY }, rows: [{ ein, expectedDigest: expected, hold }] }
  } }
  const options = { input, target, authorization: "test", readCanonical: async () => [existing] }
  const output = join(root, "plan")
  const plan = await planFilingUpdates(client, { ...options, output })
  loadPublicationPlan(output, target, plan.manifestHash)
  const row = JSON.parse(readFileSync(join(output, plan.chunks[0].file)))[0]
  assert.equal(row.expectedDigest, existing.record_digest)
  const result = JSON.parse(row.recordText)
  assert.equal(result.name, content.name); assert.equal(result.city, content.city)
  assert.equal(result.phone, content.phone); assert.equal(result.phoneBasis, "provider_confirmed")
  assert.equal(result.website, "https://communityfood.org/")
  assert.deepEqual(plan.fieldUpdate.added, { website: 1, phone: 0, description: 1 })
  expected = hash("concurrent edit")
  const raced = await planFilingUpdates(client, { ...options, output: join(root, "raced") })
  assert.equal(raced.records, 0); assert.equal(raced.holds.previous_digest_changed, 1)
  hold = "existing_platform_organization"
  const protectedPlan = await planFilingUpdates(client, { ...options, output: join(root, "owned") })
  assert.equal(protectedPlan.holds.existing_platform_organization, 1)
  hold = null
  const missing = await planFilingUpdates(client, { ...options, readCanonical: async () => [], output: join(root, "missing") })
  assert.equal(missing.holds.identity_not_published, 1)
  const excluded = await planFilingUpdates(client, { ...options, onlyEins: [], output: join(root, "unselected") })
  assert.equal(excluded.records, 0); assert.equal(excluded.fieldUpdate.unselected, 1)
  writeFileSync(join(input, "updates.jsonl"), "altered")
  await assert.rejects(planFilingUpdates(client, { ...options, output: join(root, "tampered") }), /changed/)
})
