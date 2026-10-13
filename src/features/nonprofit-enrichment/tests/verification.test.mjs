import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  assessRetained,
  verifyRetained,
  pageRejection,
} from "../server/verification.mjs"
import { openStore, hash, utc } from "../server/store.mjs"
import { importIdentities } from "../server/import.mjs"
import { ingestFilings } from "../server/filings.mjs"
import { addEvidence, evidenceFor } from "../server/queue.mjs"
const now = Date.now(),
  day = 86400_000
const identity = { ein: "123456789", organizationName: "COMMUNITY EXAMPLE INC" }
const filing = {
  ein: identity.ein,
  tax_period_end: new Date(now - 180 * day).toISOString().slice(0, 10),
  fields: { website: "www.provider.example.org", phone: "3125550100" },
}
const receipt = {
  status: "fetched",
  sourceUrl: "https://www.provider.example.org/",
  finalUrl: "https://provider.example.org/",
  finishedAt: new Date(now - 1000).toISOString(),
  evidence: {
    textExcerpt: "Community Example helps neighbors",
    contentSha256: "page-hash",
  },
  signals: { contacts: [{ type: "phone", value: "+1 (312) 555-0100" }] },
}
test("recent actual filing plus provider domain legal name and phone can verify contact fields", () => {
  const r = assessRetained(identity, receipt, [filing], now)
  assert.equal(r.verified, true)
  assert.equal(r.phone, "+13125550100")
})
test("name alone and matching phone on a different domain are insufficient", () => {
  assert.equal(
    assessRetained(identity, { ...receipt, signals: {} }, [filing], now)
      .verified,
    false
  )
  assert.equal(
    assessRetained(
      identity,
      { ...receipt, finalUrl: "https://other.example.org/" },
      [filing],
      now
    ).verified,
    false
  )
  assert.equal(
    assessRetained({ ...identity, ein: "999999999" }, receipt, [filing], now)
      .verified,
    false
  )
})
test("old and conflicting filings abstain; newer missing data cannot be filled from an older match", () => {
  assert.equal(
    assessRetained(
      identity,
      receipt,
      [{ ...filing, tax_period_end: "2000-01-01" }],
      now
    ).verified,
    false
  )
  assert.equal(
    assessRetained(
      identity,
      receipt,
      [
        filing,
        { ...filing, fields: { ...filing.fields, phone: "3125550999" } },
      ],
      now
    ).reason,
    "conflicting_latest_filing_contacts"
  )
  assert.equal(
    assessRetained(
      identity,
      receipt,
      [
        filing,
        {
          ...filing,
          tax_period_end: new Date(now - 10 * day).toISOString().slice(0, 10),
          fields: {},
        },
      ],
      now
    ).reason,
    "latest_filing_missing_contact_fields"
  )
  assert.equal(
    assessRetained(
      identity,
      { ...receipt, finishedAt: new Date(now - 31 * day).toISOString() },
      [filing],
      now
    ).verified,
    false
  )
})
test("domain-sale pages are quarantined even when names and phone happen to match", () => {
  const parked = {
    ...receipt,
    evidence: {
      ...receipt.evidence,
      textExcerpt:
        "Community Example. This domain is for sale. Buy now from a domain expert",
    },
  }
  assert.equal(pageRejection(parked), "domain_for_sale")
  assert.equal(
    assessRetained(identity, parked, [filing], now).quarantined,
    true
  )
})
async function setup(t) {
  const dir = mkdtempSync(join(tmpdir(), "nonprofit-verify-"))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const db = openStore(join(dir, "state"), { write: true })
  t.after(() => db.close())
  const input = join(dir, "identity.jsonl")
  writeFileSync(input, JSON.stringify(identity))
  await importIdentities(db, [input])
  db.prepare("INSERT INTO pages VALUES (?,?,?,?,?,?)").run(
    hash(receipt.sourceUrl),
    receipt.sourceUrl,
    "page-hash",
    receipt.finishedAt,
    now + day,
    JSON.stringify(receipt)
  )
  addEvidence(db, identity.ein, {
    field: "website",
    value: receipt.sourceUrl,
    source_url: receipt.finalUrl,
    observed_at: receipt.finishedAt,
    evidence: receipt.evidence.textExcerpt,
    source_type: "provider_page",
  })
  return { db, dir }
}
test("agent-provided IRS labels cannot substitute for the original verified XML bytes", async (t) => {
  const { db } = await setup(t)
  addEvidence(db, identity.ein, {
    field: "phone",
    value: "3125550100",
    source_url: "https://apps.irs.gov/pub/epostcard/990/xml/2026/fake.zip",
    observed_at: utc(),
    evidence: JSON.stringify(filing),
    source_type: "irs990",
    method: "irs990_xml_exact_ein_v1",
  })
  assert.equal(verifyRetained(db, identity.ein).verified, false)
  assert.ok(evidenceFor(db, identity.ein).every((r) => r.state !== "verified"))
})
test("verification re-reads exact indexed XML, retains both sources and replays idempotently", async (t) => {
  const { db, dir } = await setup(t),
    file = join(dir, "filing.xml")
  const xml = `<Return><ReturnHeader><TaxPeriodEndDt>${filing.tax_period_end}</TaxPeriodEndDt><Filer><EIN>${identity.ein}</EIN><PhoneNum>3125550100</PhoneNum></Filer></ReturnHeader><ReturnData><IRS990><WebsiteAddressTxt>www.provider.example.org</WebsiteAddressTxt></IRS990></ReturnData></Return>`
  writeFileSync(file, xml)
  writeFileSync(
    join(dir, "filing.source.json"),
    JSON.stringify({
      ein: identity.ein,
      xml_sha256: hash(xml),
      source_url:
        "https://apps.irs.gov/pub/epostcard/990/xml/2026/2026_TEOS_XML_01A.zip#filing.xml",
    })
  )
  await ingestFilings(db, [file])
  assert.equal(verifyRetained(db, identity.ein).verified, true)
  assert.equal(
    evidenceFor(db, identity.ein).filter((r) => r.state === "verified").length,
    2
  )
  assert.equal(verifyRetained(db, identity.ein).results[0].replayed, true)
  writeFileSync(file, xml.replace("3125550100", "3125550999"))
  const result = verifyRetained(db, identity.ein)
  assert.equal(result.verified, false)
  assert.equal(
    evidenceFor(db, identity.ein).filter((r) => r.state === "verified").length,
    0
  )
})

test("quarantine preserves old observations but removes them from verification and classification", async (t) => {
  const { db } = await setup(t)
  const parked = {
    ...receipt,
    evidence: {
      ...receipt.evidence,
      textExcerpt:
        "Community Example. This domain is for sale. Buy now with a payment plan.",
    },
  }
  db.prepare("UPDATE pages SET body=?").run(JSON.stringify(parked))
  addEvidence(db, identity.ein, {
    field: "phone",
    value: "3125550100",
    source_url: receipt.finalUrl,
    observed_at: receipt.finishedAt,
    evidence: "Domain seller phone",
    source_type: "provider_page",
  })
  assert.equal(
    verifyRetained(db, identity.ein).results[0].reason,
    "domain_for_sale"
  )
  assert.equal(evidenceFor(db, identity.ein).length, 2)
  assert.ok(
    evidenceFor(db, identity.ein).every((r) => r.state === "conflicting")
  )
  assert.equal(verifyRetained(db, identity.ein).verified, false)
})
