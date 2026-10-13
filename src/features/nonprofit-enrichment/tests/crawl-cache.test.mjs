import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { openStore, hash, stable, utc } from "../server/store.mjs"
import { importIdentities } from "../server/import.mjs"
import { addEvidence, claim, evidenceFor } from "../server/queue.mjs"
import { planCrawl, crawl } from "../server/crawl.mjs"
import { findCachedPage, plannedCachedPage } from "../server/crawl-cache.mjs"

const source = "https://www.provider.example.org/"
const target = "https://provider.example.org/"
const ein = "123456789"
const request = { url: target, consumers: [{ ein }] }

async function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), "enrichment-cache-"))
  const db = openStore(join(dir, "state"), { write: true })
  t.after(() => {
    db.close()
    rmSync(dir, { recursive: true, force: true })
  })
  const input = join(dir, "identity.jsonl")
  writeFileSync(
    input,
    JSON.stringify({
      ein,
      organizationName: "Community Example",
      filingAddress: { state: "IL" },
    })
  )
  await importIdentities(db, [input])
  return db
}

function seed(db, overrides = {}, expires = Date.now() + 100000) {
  const receipt = {
    receiptType: "provider",
    status: "fetched",
    sourceUrl: source,
    finalUrl: target,
    finishedAt: utc(),
    consumers: [{ ein }],
    evidence: { contentSha256: "content", textExcerpt: "Community Example" },
    ...overrides,
  }
  db.prepare("INSERT OR REPLACE INTO pages VALUES (?,?,?,?,?,?)").run(
    hash(receipt.sourceUrl),
    receipt.sourceUrl,
    receipt.evidence.contentSha256,
    receipt.finishedAt,
    expires,
    stable(receipt)
  )
  return receipt
}

test("redirect cache uses the existing destination index and preserves original receipt", async (t) => {
  const db = await fixture(t)
  const receipt = seed(db)
  const page = findCachedPage(db, request)
  assert.equal(page.cache_key, hash(source))
  assert.deepEqual(JSON.parse(page.body), receipt)
  assert.equal(db.prepare("SELECT count(*) n FROM pages").get().n, 1)
  const plan = db
    .prepare(
      "EXPLAIN QUERY PLAN SELECT * FROM pages WHERE json_extract(body,'$.finalUrl')=? AND expires_at>? ORDER BY fetched_at DESC,cache_key LIMIT 8"
    )
    .all(target, Date.now())
  assert.ok(plan.some((row) => row.detail.includes("pages_final_url")))
})

test("redirect cache rejects expired, invalid, cross-site and other-EIN receipts", async (t) => {
  const db = await fixture(t)
  for (const [overrides, expires] of [
    [{}, 0],
    [{ status: "blocked" }],
    [{ receiptType: "robots" }],
    [{ finishedAt: new Date(Date.now() - 31 * 86400_000).toISOString() }],
    [{ finishedAt: new Date(Date.now() + 100000).toISOString() }],
    [{ finishedAt: "invalid" }],
    [{ sourceUrl: "https://unrelated.example.org/" }],
    [{ sourceUrl: "https://provider.example.org:444/" }],
    [{ consumers: [{ ein: "999999999" }] }],
    [
      {
        evidence: {
          contentSha256: "content",
          pageTitle: "Domain for sale",
          textExcerpt: "This domain is for sale. Buy now",
        },
      },
    ],
  ]) {
    db.prepare("DELETE FROM pages").run()
    seed(db, overrides, expires)
    assert.equal(
      findCachedPage(db, request),
      undefined,
      JSON.stringify(overrides)
    )
  }
  db.prepare("DELETE FROM pages").run()
  seed(db, { finalUrl: "http://provider.example.org/" })
  assert.equal(
    findCachedPage(db, { ...request, url: "http://provider.example.org/" }),
    undefined
  )
})

test("fresh direct cache wins and redirect plan pins body and expiry", async (t) => {
  const db = await fixture(t)
  seed(db)
  const page = findCachedPage(db, request)
  const pinned = {
    ...request,
    cacheKey: page.cache_key,
    cacheBodyHash: hash(page.body),
  }
  assert.equal(plannedCachedPage(db, pinned).body, page.body)
  seed(db, { sourceUrl: target })
  assert.equal(findCachedPage(db, request).cache_key, hash(target))
  seed(db, { evidence: { contentSha256: "changed", textExcerpt: "Updated" } })
  assert.throws(() => plannedCachedPage(db, pinned), /cache changed/)
  db.prepare("UPDATE pages SET expires_at=0").run()
  assert.throws(() => plannedCachedPage(db, pinned), /cache expired/)
})

test("redirected homepage is reused without network or new evidence identities", async (t) => {
  const db = await fixture(t)
  addEvidence(db, ein, {
    field: "website",
    value: source,
    source_url: "https://www.irs.gov/",
    observed_at: utc(),
    evidence: "Filed website",
  })
  const claims = claim(db, { worker: "redirect-cache" })
  const calls = []
  const options = {
    sleep: async () => {},
    resolveHostname: async () => [{ address: "93.184.216.34", family: 4 }],
    transport: async ({ url }) => {
      calls.push(url)
      if (url === source)
        return {
          status: 301,
          headers: { location: target },
          body: Buffer.from(""),
        }
      const robots = url.endsWith("robots.txt")
      return {
        status: 200,
        headers: { "content-type": robots ? "text/plain" : "text/html" },
        body: Buffer.from(
          robots
            ? "User-agent: *\nAllow: /"
            : "<html><body>Community Example EIN 12-3456789 <a href='tel:3125550100'>Call</a></body></html>"
        ),
      }
    },
  }
  const initial = planCrawl(db, claims)
  await crawl(db, initial, initial.hash, options)
  const evidence = evidenceFor(db, ein)
  const rows = db.prepare("SELECT * FROM pages").all()
  const followup = planCrawl(db, claims, { followLinks: true })
  assert.equal(followup.fetch.requests.length, 0)
  assert.equal(followup.cached.length, 2)
  assert.equal(
    followup.cached.find((r) => r.url === target).cacheKey,
    hash(source)
  )
  const count = calls.length
  const result = await crawl(db, followup, followup.hash, options)
  assert.equal(result.networkRequests, 0)
  assert.equal(calls.length, count)
  assert.deepEqual(evidenceFor(db, ein), evidence)
  assert.deepEqual(db.prepare("SELECT * FROM pages").all(), rows)
  db.prepare("UPDATE pages SET body=?").run(
    stable({ ...JSON.parse(rows[0].body), finishedAt: utc() + "changed" })
  )
  await assert.rejects(
    crawl(db, followup, followup.hash, options),
    /cache changed/
  )
  assert.equal(calls.length, count)
})

test("changed cache fails before uncached requests can start", async (t) => {
  const db = await fixture(t)
  seed(db)
  for (const value of [target, "https://fresh.example.org/"])
    addEvidence(db, ein, {
      field: "website",
      value,
      source_url: "https://www.irs.gov/",
      observed_at: utc(),
      evidence: "Filed website",
    })
  const plan = planCrawl(db, claim(db, { worker: "cache-preflight" }))
  assert.equal(plan.cached.length, 1)
  assert.equal(plan.fetch.requests.length, 1)
  seed(db, { evidence: { contentSha256: "changed", textExcerpt: "Updated" } })
  await assert.rejects(
    crawl(db, plan, plan.hash, {
      transport: async () =>
        assert.fail("Changed cache must fail before fetching"),
    }),
    /cache changed/
  )
})

test("redirected follow-up cache cannot become a homepage assertion", async (t) => {
  const db = await fixture(t)
  addEvidence(db, ein, {
    field: "website",
    value: target,
    source_url: "https://www.irs.gov/",
    observed_at: utc(),
    evidence: "Filed website",
  })
  seed(db, {
    sourceUrl: target,
    signals: {
      evidenceLinkCandidates: [{ url: target + "contact", label: "Contact" }],
    },
  })
  seed(db, {
    sourceUrl: target + "old-contact",
    finalUrl: target + "contact",
    signals: { contacts: [{ type: "phone", value: "3125550100" }] },
  })
  const plan = planCrawl(db, claim(db, { worker: "contact-cache" }), {
    followLinks: true,
  })
  assert.equal(plan.followups.length, 1)
  assert.equal(plan.fetch.requests.length, 0)
  assert.equal(
    plan.cached.find((r) => r.url.endsWith("/contact")).cacheKey,
    hash(target + "old-contact")
  )
  await crawl(db, plan, plan.hash, {
    transport: async () => assert.fail("Cache must avoid fetching"),
  })
  const evidence = evidenceFor(db, ein)
  assert.ok(
    evidence.some(
      (row) => row.field === "phone" && row.source_url === target + "contact"
    )
  )
  assert.ok(
    evidence
      .filter((row) => row.field === "website")
      .every((row) => row.value === target)
  )
})
