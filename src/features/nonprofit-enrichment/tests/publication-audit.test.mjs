import { test } from "node:test"
import assert from "node:assert/strict"
import {
  mkdtempSync,
  writeFileSync,
  readFileSync,
  rmSync,
  existsSync,
  statSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { openStore, hash, stable } from "../server/store.mjs"
import { importIdentities } from "../server/import.mjs"
import { ingestFilings } from "../server/filings.mjs"
import { auditNational } from "../server/audit-national.mjs"
import { auditContext, withAuditContext } from "../server/audit-context.mjs"
import { auditPublication } from "../server/publication-audit.mjs"
import {
  assessOrganization,
  reportedWebsite,
} from "../server/publication-policy.mjs"
import { assessAuditAddress } from "../server/audit-addresses.mjs"
import { matchBmfSources } from "../server/source-inventory.mjs"

const now = Date.parse("2026-10-06T19:00:00Z")
const ein = "012345678"
const name = "COMMUNITY FOOD CENTER"
const address = {
  street: "10 MAIN ST",
  city: "CHICAGO",
  state: "IL",
  postalCode: "60601",
}
const bmfRow = {
  ein,
  name,
  address,
  sourceId: "bmf",
  sourceRow: 1,
  statusCode: "01",
  nteeCode: "K30",
  rowHash: "row",
}
const row = { ein, identity: stable({ ein, organizationName: name }) }
const source = { completed: 1, integrity: "matched" }
const filing = (fields, date = "2025-12-31", amended = "") => ({
  ein,
  fields,
  tax_period_end: date,
  amended,
  sourceId: hash({ fields, date, amended }),
  source_sha256: hash({ fields, date, amended }),
  source_url: "https://apps.irs.gov/pub/epostcard/990/xml/2026/a.zip#a.xml",
})
const evidence = (f, field) => ({
  id: hash({ f, field }),
  field,
  state: "candidate",
  value: stable(f.fields[field]),
  source_url: f.source_url,
  body: stable({
    method: "irs990_xml_exact_ein_v1",
    source_type: "irs990",
    license: "irs_public_filing",
    evidence: stable({ sourceSha256: f.source_sha256, value: f.fields[field] }),
  }),
})
const assess = (extra = {}) =>
  assessOrganization({ row, source, bmfRows: [bmfRow], now, ...extra })

test("directory identity does not require contact fields, coordinates, or a service category", () => {
  const result = assess()
  assert.equal(result.directory.eligible, true)
  assert.equal(result.directory.readyToPublish, false)
  assert.equal(result.fields.website.eligible, false)
  assert.equal(result.location.geocodeCandidate, true)
  assert.equal(result.location.pinEligible, false)
  assert.equal(result.services.eligible, false)
  assert.equal(result.organizationClassification.provesServices, false)
  assert.equal(
    assess({ bmfRows: [{ ...bmfRow, name: "OTHER ENTITY" }] }).directory
      .eligible,
    false
  )
  assert.equal(
    assess({ source: { ...source, integrity: "hash_mismatch" } }).directory
      .eligible,
    false
  )
})

test("independent exact-filing website rule holds forged evidence and quarantined sites", () => {
  const f = filing({ website: "communityfood.org" }),
    e = evidence(f, "website")
  const result = assess({ filings: [f], evidence: [e] })
  assert.equal(result.fields.website.eligible, true)
  assert.equal(result.fields.website.basis, "source_reported")
  assert.equal(result.fields.website.currentProviderConfirmed, false)
  assert.equal(result.fields.phone.eligible, false)
  assert.equal(
    assess({ filings: [f], evidence: [{ ...e, value: '"unrelated.org"' }] })
      .fields.website.eligible,
    false
  )
  assert.equal(
    assess({ filings: [f], evidence: [{ ...e, state: "conflicting" }] }).fields
      .website.state,
    "conflicting"
  )
  assert.equal(
    assess({
      filings: [f],
      evidence: [e],
      quarantines: [{ source_url: "https://www.communityfood.org/" }],
    }).fields.website.eligible,
    false
  )
  for (const url of [
    "127.0.0.1",
    "http://169.254.169.254/",
    "localhost",
    "https://account:secret@communityfood.org",
    "javascript:alert(1)",
  ])
    assert.equal(reportedWebsite(url), null)
})

test("new periods and amendments supersede older values; unresolved ties do not auto-publish", () => {
  const old = filing({ phone: "3125551212" }, "2024-12-31"),
    current = filing({ phone: "7735551212" })
  let result = assess({
    filings: [old, current],
    evidence: [evidence(old, "phone"), evidence(current, "phone")],
  })
  assert.equal(result.fields.phone.value, "+17735551212")
  const tie = filing({ phone: "3125551212" })
  result = assess({
    filings: [current, tie],
    evidence: [evidence(current, "phone"), evidence(tie, "phone")],
  })
  assert.equal(result.fields.phone.state, "conflicting")
  const amended = filing({ phone: "3125551212" }, "2025-12-31", "true")
  result = assess({
    filings: [current, amended],
    evidence: [evidence(current, "phone"), evidence(amended, "phone")],
  })
  assert.equal(result.fields.phone.value, "+13125551212")
  result = assess({
    filings: [old, filing({})],
    evidence: [evidence(old, "phone")],
  })
  assert.equal(result.fields.phone.eligible, false)
  const prefix = "a".repeat(1100),
    a = filing({ description: prefix + "x" }),
    b = filing({ description: prefix + "y" })
  assert.equal(
    assess({
      filings: [a, b],
      evidence: [evidence(a, "description"), evidence(b, "description")],
    }).fields.description.state,
    "conflicting"
  )
})

test("mailboxes, care-of, confidentiality and unsupported address formats cannot become pins", () => {
  for (const street of [
    "PO BOX 4",
    "P.O. BOX 4",
    "POST OFFICE BOX 4",
    "10 MAIN ST PMB 4",
    "GENERAL DELIVERY",
  ]) {
    const result = assessAuditAddress({ ...address, street }, {})
    assert.equal(result.geocodeCandidate, false, street)
    assert.equal(result.reason, "mailbox_or_mail_drop")
  }
  assert.equal(
    assessAuditAddress(address, { inCareOf: "AN ACCOUNTANT" }).reason,
    "care_of_or_agent_review"
  )
  assert.equal(
    assessAuditAddress({ ...address, confidential: true }, {}).reason,
    "confidential_address"
  )
  assert.equal(
    assessAuditAddress({ ...address, state: "AE" }, {}).geocodeCandidate,
    false
  )
  assert.equal(assessAuditAddress(address, {}).pinEligible, false)
})

async function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), "nonprofit-audit-"))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const identityFile = join(dir, "identities.jsonl"),
    csv = join(dir, "eo.csv"),
    state = join(dir, "state")
  writeFileSync(identityFile, row.identity + "\n")
  writeFileSync(
    csv,
    `EIN,NAME,ICO,STREET,CITY,STATE,ZIP,STATUS,TAX_PERIOD,NTEE_CD\n${ein},${name},,10 MAIN ST,CHICAGO,IL,60601,01,202512,K30\n`
  )
  const db = openStore(state, { write: true })
  await importIdentities(db, [identityFile], { all: true })
  const xml = join(dir, "filing.xml")
  const body = `<Return><ReturnHeader><Filer><EIN>${ein}</EIN></Filer><TaxYr>2025</TaxYr><TaxPeriodEndDt>2025-12-31</TaxPeriodEndDt></ReturnHeader><ReturnData><IRS990><WebsiteAddressTxt>communityfood.org</WebsiteAddressTxt></IRS990></ReturnData></Return>`
  writeFileSync(xml, body)
  writeFileSync(
    join(dir, "filing.source.json"),
    stable({
      ein,
      xml_sha256: hash(body),
      source_url: "https://apps.irs.gov/pub/epostcard/990/xml/2026/a.zip#a.xml",
    })
  )
  await ingestFilings(db, [xml])
  db.close()
  return { dir, identityFile, csv, state, xml }
}

test("full audit replays deterministically without changing ledger, jobs or evidence", async (t) => {
  const { dir, csv, state } = await fixture(t),
    db = openStore(state)
  t.after(() => db.close())
  const before = readFileSync(join(state, "research.sqlite"))
  const a = await auditPublication(db, {
    inputs: [csv],
    output: join(dir, "first"),
    now,
  })
  const b = await auditPublication(db, {
    inputs: [csv],
    output: join(dir, "second"),
    now,
  })
  assert.equal(a.organizations, 1)
  assert.equal(a.directoryEligible, 1)
  assert.equal(a.fields.website.sourceReported, 1)
  assert.equal(a.fields.website.providerConfirmed, 0)
  assert.equal(
    a.outputHashes["eligibility.jsonl"],
    b.outputHashes["eligibility.jsonl"]
  )
  assert.equal(a.ledgerInputDigest, b.ledgerInputDigest)
  assert.deepEqual(readFileSync(join(state, "research.sqlite")), before)
  assert.equal(statSync(join(dir, "first", "report.json")).mode & 0o777, 0o600)
  assert.equal(statSync(join(dir, "first")).mode & 0o777, 0o700)
  await assert.rejects(
    auditPublication(db, { inputs: [csv], output: join(dir, "first"), now }),
    /exist/
  )
})

test("changed original XML holds affected fields; missing inputs never leave a completion report", async (t) => {
  const { dir, csv, state, xml } = await fixture(t),
    db = openStore(state)
  t.after(() => db.close())
  writeFileSync(xml, "changed")
  const result = await auditPublication(db, {
    inputs: [csv],
    output: join(dir, "changed"),
    now,
  })
  assert.equal(result.directoryEligible, 1)
  assert.equal(result.fields.website.sourceReported, 0)
  assert.ok(result.sourceIntegrity.hash_mismatch > 0)
  await assert.rejects(
    auditPublication(db, {
      inputs: [join(dir, "missing.csv")],
      output: join(dir, "bad"),
      now,
    }),
    /unavailable/
  )
  assert.equal(existsSync(join(dir, "bad", "report.json")), false)
  await assert.rejects(matchBmfSources([csv, csv], new Set([ein])), /Duplicate/)
})

test("CLI dry run creates no state; actual audit requires existing state and never creates missing ledger", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "nonprofit-audit-cli-"))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const cli = fileURLToPath(new URL("../server/cli.mjs", import.meta.url)),
    state = join(dir, "absent")
  const args = [
    cli,
    "audit-publication",
    "--state",
    state,
    "--input",
    "missing",
    "--output",
    join(dir, "out"),
  ]
  assert.equal(
    JSON.parse(execFileSync(process.execPath, args, { encoding: "utf8" }))
      .dryRun,
    true
  )
  assert.equal(existsSync(state), false)
  assert.throws(
    () =>
      execFileSync(process.execPath, [...args, "--write"], { stdio: "pipe" }),
    /Command failed/
  )
  assert.equal(existsSync(state), false)
})

test("bounded audit cursors partition identities without skips, duplicates or unbounded selection", async (t) => {
  const { dir, csv, state } = await fixture(t)
  const extra = join(dir, "extra.jsonl")
  writeFileSync(
    extra,
    stable({ ein: "112345678", organizationName: "SECOND CENTER" }) + "\n"
  )
  const writable = openStore(state, { write: true })
  await importIdentities(writable, [extra], { all: true })
  writable.close()
  const db = openStore(state)
  t.after(() => db.close())
  const first = await auditPublication(db, {
    inputs: [csv],
    output: join(dir, "page1"),
    limit: 1,
    now,
  })
  assert.equal(first.organizations, 1)
  assert.equal(first.selection.population, 2)
  assert.equal(first.selection.nextAfter, ein)
  const second = await auditPublication(db, {
    inputs: [csv],
    output: join(dir, "page2"),
    limit: 1,
    after: first.selection.nextAfter,
    now,
  })
  assert.equal(second.organizations, 1)
  assert.equal(second.selection.lastEin, "112345678")
  assert.equal(second.selection.nextAfter, null)
  assert.equal(second.directoryEligible, 0) // No BMF match: cursor does not bypass policy.
  for (const options of [{ limit: 50001 }, { limit: 0 }, { after: "bad" }]) {
    await assert.rejects(
      auditPublication(db, {
        inputs: [csv],
        output: join(dir, "invalid"),
        ...options,
      }),
      /Audit/
    )
  }
  await assert.rejects(
    auditPublication(db, {
      inputs: [csv],
      output: join(dir, "empty"),
      after: "999999999",
    }),
    /No organizations/
  )
  assert.equal(existsSync(join(dir, "empty", "report.json")), false)
})

test("shared source context preserves decisions and snapshot while partitioning with durable boundaries", async (t) => {
  const { dir, csv, state } = await fixture(t)
  const extra = join(dir, "extra.jsonl")
  writeFileSync(
    extra,
    stable({ ein: "112345678", organizationName: "SECOND CENTER" }) + "\n"
  )
  const writable = openStore(state, { write: true })
  await importIdentities(writable, [extra], { all: true })
  writable.close()
  const db = openStore(state)
  t.after(() => db.close())
  const original = await auditPublication(db, {
    inputs: [csv],
    output: join(dir, "original"),
    now,
  })
  const phases = []
  const result = await auditNational(db, {
    inputs: [csv],
    output: join(dir, "national"),
    now,
    limit: 1,
    onProgress: (p) => phases.push(p.phase),
  })
  assert.equal(result.organizations, 2)
  assert.equal(result.directoryEligible, 1)
  assert.equal(result.hasMore, false)
  assert.equal(phases.filter((p) => p === "index_bmf").length, 1)
  const decisions = result.batches
    .map((b) =>
      readFileSync(join(b.auditDirectory, "eligibility.jsonl"), "utf8")
    )
    .join("")
  assert.equal(
    decisions,
    readFileSync(join(dir, "original", "eligibility.jsonl"), "utf8")
  )
  assert.equal(original.directoryEligible, result.directoryEligible)
  assert.ok(existsSync(join(dir, "national", "completed-002.json")))
  assert.equal(auditContext(db), undefined)
  const stopped = await auditNational(db, {
    inputs: [csv],
    output: join(dir, "stopped"),
    now,
    limit: 1,
    shouldStop: () => existsSync(join(dir, "stopped", "completed-001.json")),
  })
  assert.equal(stopped.lastEin, ein)
  assert.equal(stopped.stopped, true)
  const resumed = await auditNational(db, {
    inputs: [csv],
    output: join(dir, "resumed"),
    now,
    after: stopped.lastEin,
  })
  assert.equal(resumed.organizations, 1)
  assert.equal(resumed.batches[0].lastEin, "112345678")
})

test("shared context rejects different inputs and cleans up after failures", async (t) => {
  const { dir, csv, state } = await fixture(t),
    db = openStore(state)
  t.after(() => db.close())
  await assert.rejects(
    withAuditContext(db, { inputs: [csv], now }, () =>
      auditPublication(db, {
        inputs: [csv],
        output: join(dir, "mismatch"),
        now: now + 1,
      })
    ),
    /mismatch/
  )
  assert.equal(auditContext(db), undefined)
  // Transaction was released and a fresh source mutation is detected.
  writeFileSync(csv, "invalid")
  await assert.rejects(
    auditNational(db, { inputs: [csv], output: join(dir, "bad-context"), now }),
    /columns|header|No|CSV/i
  )
  assert.equal(existsSync(join(dir, "bad-context", "result.json")), false)
  assert.equal(auditContext(db), undefined)
  assert.equal(db.prepare("SELECT count(*) n FROM organizations").get().n, 1)
})
