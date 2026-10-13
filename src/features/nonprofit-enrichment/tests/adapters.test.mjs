import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { openStore, utc } from "../server/store.mjs"
import { importIdentities } from "../server/import.mjs"
import {
  claim,
  addEvidence,
  evidenceFor,
  missingFields,
} from "../server/queue.mjs"
import { ingestEvidence } from "../server/evidence-import.mjs"
import { classifyEvidence } from "../server/classification.mjs"
import { ingestFilings } from "../server/filings.mjs"
import { planCrawl, crawl, websiteCandidateUrl } from "../server/crawl.mjs"
import "./crawl-network.test.mjs"
async function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), "enrichment-adapter-"))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const input = join(dir, "identity.jsonl")
  writeFileSync(
    input,
    JSON.stringify({
      ein: "123456789",
      organizationName: "Community Example",
      filingAddress: { state: "IL" },
    })
  )
  const db = openStore(join(dir, "state"), { write: true })
  t.after(() => db.close())
  await importIdentities(db, [input])
  return { db, dir }
}
test("IRS XML joins exact EIN, retains vintage, abstains from service-location inference and replays", async (t) => {
  const { db, dir } = await fixture(t),
    file = join(dir, "filing.xml")
  writeFileSync(
    file,
    `<Return xmlns="http://www.irs.gov/efile"><ReturnHeader><TaxYr>2025</TaxYr><TaxPeriodEndDt>2025-12-31</TaxPeriodEndDt><Filer><EIN>123456789</EIN><PhoneNum>3125550100</PhoneNum><USAddress><AddressLine1Txt>PO BOX 42</AddressLine1Txt></USAddress></Filer></ReturnHeader><ReturnData><IRS990><WebsiteAddressTxt>https://provider.example.org</WebsiteAddressTxt><MissionDesc>We provide food assistance.</MissionDesc></IRS990></ReturnData></Return>`
  )
  const result = await ingestFilings(db, [file])
  assert.equal(result.assertions, 4)
  assert.deepEqual(result.newlyCoveredFields, {
    website: 1,
    phone: 1,
    description: 1,
  })
  assert.equal(result.newlyEnrichedOrganizations, 1)
  const fields = evidenceFor(db, "123456789")
  assert.ok(fields.every((f) => f.state === "candidate"))
  assert.ok(
    !fields.some(
      (f) => f.field === "service_locations" || f.field === "coordinates"
    )
  )
  assert.ok(fields[0].body.evidence.includes("2025"))
  const replay = await ingestFilings(db, [file])
  assert.equal(replay.replayed, 1)
  assert.equal(replay.newlyEnrichedOrganizations, 0)
  assert.deepEqual(replay.newlyCoveredFields, {
    website: 0,
    phone: 0,
    description: 0,
  })
})
test("XML external entities rejected and parser errors recorded", async (t) => {
  const { db, dir } = await fixture(t),
    file = join(dir, "evil.xml")
  writeFileSync(
    file,
    '<!DOCTYPE x [<!ENTITY x SYSTEM "file:///etc/passwd">]><Return>&x;</Return>'
  )
  assert.equal((await ingestFilings(db, [file])).errors, 1)
  assert.equal(evidenceFor(db, "123456789").length, 0)
})
test("crawl binds confirmation, records evidence and reuses cache across plans", async (t) => {
  const { db } = await fixture(t)
  addEvidence(db, "123456789", {
    field: "website",
    value: "https://provider.example.org/",
    source_url: "https://www.irs.gov/",
    observed_at: utc(),
    evidence: "Website declared in filing",
  })
  const claims = claim(db, { worker: "crawler" })
  const bundle = planCrawl(db, claims)
  await assert.rejects(crawl(db, bundle, "wrong"), /hash confirmation/)
  let calls = 0
  const options = {
    resolveHostname: async () => [{ address: "93.184.216.34", family: 4 }],
    transport: async ({ url }) => {
      calls++
      return url.endsWith("robots.txt")
        ? {
            status: 200,
            headers: { "content-type": "text/plain" },
            body: Buffer.from("User-agent: *\nAllow: /"),
          }
        : {
            status: 200,
            headers: { "content-type": "text/html" },
            body: Buffer.from(
              '<html><body><h1>Community Example</h1><p>EIN 12-3456789</p><a href="tel:3125550100">Call</a></body></html>'
            ),
          }
    },
  }
  const result = await crawl(db, bundle, bundle.hash, options)
  assert.equal(result.networkRequests, 2)
  assert.equal(calls, 2)
  assert.ok(
    evidenceFor(db, "123456789").some(
      (f) => f.field === "website" && f.state === "verified"
    )
  )
  const second = planCrawl(db, claims)
  assert.equal(second.cached.length, 1)
  const reused = await crawl(db, second, second.hash, options)
  assert.equal(reused.networkRequests, 0)
  assert.equal(reused.cacheHits, 1)
  assert.equal(calls, 2)
})
test("source candidate without matching EIN never auto-verifies website", async (t) => {
  const { db } = await fixture(t)
  addEvidence(db, "123456789", {
    field: "website",
    value: "https://provider.example.org/",
    source_url: "https://www.irs.gov/",
    observed_at: utc(),
    evidence: "Candidate website",
  })
  const bundle = planCrawl(db, claim(db, { worker: "crawler" }))
  await crawl(db, bundle, bundle.hash, {
    resolveHostname: async () => [{ address: "93.184.216.34", family: 4 }],
    transport: async ({ url }) => ({
      status: 200,
      headers: {
        "content-type": url.endsWith("robots.txt") ? "text/plain" : "text/html",
      },
      body: Buffer.from(
        url.endsWith("robots.txt")
          ? "User-agent: *\nAllow: /"
          : "<html><body>Community Example</body></html>"
      ),
    }),
  })
  assert.ok(evidenceFor(db, "123456789").every((f) => f.state === "candidate"))
})

test("follow-up crawl collects contact/service evidence, preserves homepage and replays cache", async (t) => {
  const { db } = await fixture(t)
  addEvidence(db, "123456789", {
    field: "website",
    value: "https://provider.example.org/",
    source_url: "https://www.irs.gov/",
    observed_at: utc(),
    evidence: "Filed website",
  })
  const claims = claim(db, { worker: "followups" })
  const requested = []
  const options = {
    resolveHostname: async () => [{ address: "93.184.216.34", family: 4 }],
    sleep: async () => {},
    transport: async ({ url }) => {
      requested.push(url)
      const robots = url.endsWith("robots.txt")
      const root = new URL(url).pathname === "/"
      return {
        status: 200,
        headers: { "content-type": robots ? "text/plain" : "text/html" },
        body: Buffer.from(
          robots
            ? "User-agent: *\nAllow: /"
            : root
              ? `<html><body>Community Example EIN 12-3456789
            <a href="/contact">Contact</a><a href="/food-program">Food program</a>
            <a href="/location">Location</a><a href="https://other.example.org/contact">Contact</a>
            <a href="/contact?session=secret">Contact</a><a href="/service.pdf">Service</a>
            <a href="/calendar/programs">Program calendar</a><a href="/schedule">Program schedule</a>
            </body></html>`
              : `<html><body>Community Example EIN 12-3456789
              <p>We provide food assistance and free groceries to families.</p>
              <a href="tel:3125550100">Call</a><a href="/another-contact">Contact</a>
            </body></html>`
        ),
      }
    },
  }
  const first = planCrawl(db, claims)
  await crawl(db, first, first.hash, options)
  const plan = planCrawl(db, claims, { followLinks: true })
  assert.equal(plan.cached.length, 1)
  assert.equal(plan.followups.length, 2)
  assert.ok(
    plan.fetch.requests.every((r) =>
      ["/contact", "/food-program"].includes(new URL(r.url).pathname)
    )
  )
  const result = await crawl(db, plan, plan.hash, options)
  assert.equal(result.networkRequests, 3)
  const evidence = evidenceFor(db, "123456789")
  assert.ok(
    evidence.some(
      (r) => r.field === "phone" && r.source_url.endsWith("/contact")
    )
  )
  assert.ok(evidence.some((r) => r.field === "services"))
  assert.ok(
    evidence
      .filter((r) => r.field === "website")
      .every((r) => r.value === "https://provider.example.org/")
  )
  assert.ok(
    !requested.some((url) =>
      /other\.example|session=|\.pdf|another-contact|calendar|schedule/.test(url)
    )
  )
  const replay = planCrawl(db, claims, { followLinks: true })
  const previousCalls = requested.length
  assert.equal(
    (await crawl(db, replay, replay.hash, options)).networkRequests,
    0
  )
  assert.equal(requested.length, previousCalls)
  assert.equal(replay.cached.length, 3)
  assert.ok(
    db
      .prepare("SELECT count(*) n FROM runs WHERE kind LIKE 'crawl_timing:%'")
      .get().n > 0
  )
})

test("follow-up parent expiry prevents any new network work", async (t) => {
  const { db } = await fixture(t)
  const url = "https://provider.example.org/"
  addEvidence(db, "123456789", {
    field: "website",
    value: url,
    source_url: "https://www.irs.gov/",
    observed_at: utc(),
    evidence: "Filed website",
  })
  const { hash, stable } = await import("../server/store.mjs")
  const receipt = {
    status: "fetched",
    finalUrl: url,
    sourceUrl: url,
    evidence: { contentSha256: "parent", textExcerpt: "Community Example" },
    signals: {
      evidenceLinkCandidates: [{ url: url + "contact", label: "Contact" }],
    },
  }
  db.prepare("INSERT INTO pages VALUES (?,?,?,?,?,?)").run(
    hash(url),
    url,
    "parent",
    utc(),
    Date.now() + 100000,
    stable(receipt)
  )
  const plan = planCrawl(db, claim(db, { worker: "expiry" }), {
    followLinks: true,
  })
  assert.equal(plan.followups.length, 1)
  db.prepare("UPDATE pages SET expires_at=0").run()
  await assert.rejects(
    crawl(db, plan, plan.hash, {
      transport: async () =>
        assert.fail("Expired evidence must not start a request"),
    }),
    /parent evidence changed/
  )
})

test("cache filtering cannot admit follow-up URLs rejected by the bounded full plan", async (t) => {
  const { db } = await fixture(t)
  const { hash, stable } = await import("../server/store.mjs")
  for (const path of ["/", "/home", "/index.html"]) {
    const url = "https://provider.example.org" + path
    addEvidence(db, "123456789", {
      field: "website",
      value: url,
      source_url: "https://www.irs.gov/",
      observed_at: utc(),
      evidence: "Filed website",
    })
    const receipt = {
      status: "fetched",
      finalUrl: url,
      sourceUrl: url,
      evidence: { contentSha256: hash(url), textExcerpt: "Community Example" },
      signals: {
        evidenceLinkCandidates: [
          { url: "https://provider.example.org/contact", label: "Contact" },
        ],
      },
    }
    db.prepare("INSERT INTO pages VALUES (?,?,?,?,?,?)").run(
      hash(url),
      url,
      hash(url),
      utc(),
      Date.now() + 100000,
      stable(receipt)
    )
  }
  const plan = planCrawl(db, claim(db, { worker: "budget" }), {
    followLinks: true,
  })
  assert.equal(plan.cached.length, 3)
  assert.equal(plan.followups.length, 0)
  assert.equal(plan.fetch.requests.length, 0)
})

test("bounded XML ingestion advances past unmatched and parsed files", async (t) => {
  const { db, dir } = await fixture(t)
  for (const [name, ein] of [
    ["a", "999999999"],
    ["b", "123456789"],
    ["c", "123456789"],
  ])
    writeFileSync(
      join(dir, name + ".xml"),
      `<Return><ReturnHeader><Filer><EIN>${ein}</EIN></Filer></ReturnHeader><ReturnData><IRS990><MissionDesc>Mission ${name}</MissionDesc></IRS990></ReturnData></Return>`
    )
  assert.equal((await ingestFilings(db, [dir], { limit: 1 })).unmatched, 1)
  assert.equal((await ingestFilings(db, [dir], { limit: 1 })).matched, 1)
  assert.equal((await ingestFilings(db, [dir], { limit: 1 })).matched, 1)
  assert.equal((await ingestFilings(db, [dir], { limit: 1 })).files, 0)
  assert.equal(evidenceFor(db, "123456789").length, 2)
})
test("offline evidence resumes at committed row; classification remains candidate", async (t) => {
  const { db, dir } = await fixture(t)
  const file = join(dir, "evidence.jsonl")
  writeFileSync(
    file,
    ["website", "description"]
      .map((field) =>
        JSON.stringify({
          ein: "123456789",
          assertions: [
            {
              field,
              value:
                field === "website" ? "https://example.org" : "Food pantry",
              source_url: "https://example.org",
              observed_at: utc(),
              evidence: "We operate a food pantry and offer food assistance.",
              state: "verified",
            },
          ],
        })
      )
      .join("\n")
  )
  assert.equal((await ingestEvidence(db, file, { limit: 1 })).completed, false)
  assert.equal((await ingestEvidence(db, file, { limit: 1 })).completed, true)
  assert.equal((await ingestEvidence(db, file, { limit: 1 })).replayed, true)
  assert.equal(evidenceFor(db, "123456789").length, 2)
  assert.ok(classifyEvidence(db, "123456789").candidates > 0)
  assert.ok(evidenceFor(db, "123456789").every((a) => a.state === "candidate"))
})
test("expired verification is retained but cannot suppress missing-field work", async (t) => {
  const { db } = await fixture(t)
  addEvidence(
    db,
    "123456789",
    {
      field: "website",
      value: "https://example.org",
      source_url: "https://example.org",
      observed_at: new Date(Date.now() - 31 * 86400_000).toISOString(),
      evidence: "Historical exact identity",
    },
    { trustedState: "verified" }
  )
  assert.ok(missingFields(db, "123456789").includes("website"))
  assert.equal(evidenceFor(db, "123456789")[0].state, "verified")
})

test("filing website hints gain a protocol without accepting unsafe URLs", () => {
  assert.equal(
    websiteCandidateUrl("WWW.EXAMPLE.ORG"),
    "https://www.example.org/"
  )
  assert.equal(websiteCandidateUrl("javascript:alert(1)"), null)
  assert.equal(websiteCandidateUrl("NO WEBSITE"), null)
  assert.equal(websiteCandidateUrl("https://user:secret@example.org"), null)
})
