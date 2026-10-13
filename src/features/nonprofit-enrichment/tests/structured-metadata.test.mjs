import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  extractStructuredMetadata,
  METADATA_METHOD,
} from "../server/structured-metadata.mjs"
import { openStore, hash, utc } from "../server/store.mjs"
import { importIdentities } from "../server/import.mjs"
import { addEvidence, claim, evidenceFor } from "../server/queue.mjs"
import { planCrawl, crawl } from "../server/crawl.mjs"
import { validateOwnedCrawlerReceiptChain } from "../../../../scripts/resource-map/lib/irs-eo-owned-crawler.mjs"
import { createStructuredCollector } from "../server/structured-evidence.mjs"

const url = "https://provider.example.org/"
const script = (data) =>
  `<script type="application/ld+json">${JSON.stringify(data)}</script>`
const org = {
  "@type": "Organization",
  "@id": url + "#organization",
  name: "Community Example",
  url,
}

test("JSON-LD graph resolves local assets/contact references and preserves wording", () => {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        ...org,
        description: "OUR Mission.\nKeep THEIR words!",
        logo: { "@id": "#logo" },
        contactPoint: { "@id": "#contact" },
        sameAs: [
          "https://facebook.com/community",
          "https://linkedin.com/in/person",
          "https://x.com/intent/tweet",
          "javascript:alert(1)",
        ],
      },
      { "@id": "#logo", "@type": "ImageObject", contentUrl: "/logo.svg" },
      {
        "@id": "#contact",
        "@type": "ContactPoint",
        telephone: "312-555-0100",
        email: "office@provider.example.org",
      },
    ],
  }
  const rows = extractStructuredMetadata(script(data), url)
  assert.equal(rows.length, 1)
  assert.equal(rows[0].description, data["@graph"][0].description)
  assert.deepEqual(rows[0].logos, [url + "logo.svg"])
  assert.deepEqual(rows[0].phones, ["312-555-0100"])
  assert.deepEqual(rows[0].emails, ["office@provider.example.org"])
  assert.deepEqual(rows[0].socialUrls, ["https://facebook.com/community"])
})

test("ignores people, unrelated organizations, unsafe assets and malformed blocks", () => {
  const html =
    '<script type="application/ld+json">invalid</script>' +
    script([
      { ...org, "@type": "Person" },
      { ...org, url: "https://unrelated.org/" },
      {
        ...org,
        logo: [
          "http://127.0.0.1/logo",
          "http://localhost/logo",
          "https://user:secret@example.org/logo",
          "data:image/png,a",
          "/ok.png",
        ],
      },
    ])
  assert.deepEqual(
    extractStructuredMetadata(script(org).replace("type=", "data-type="), url),
    []
  )
  const rows = extractStructuredMetadata(html, url)
  assert.equal(rows.length, 1)
  assert.deepEqual(rows[0].logos, [url + "ok.png"])
})

test("bounded parser ignores oversized blocks, deep nesting and unsupported types", () => {
  assert.deepEqual(
    extractStructuredMetadata(
      script({ ...org, description: "x".repeat(130000) }),
      url
    ),
    []
  )
  let deep = org
  for (let i = 0; i < 15; i++) deep = { child: deep }
  assert.deepEqual(extractStructuredMetadata(script(deep), url), [])
  assert.deepEqual(
    extractStructuredMetadata(script({ ...org, "@type": "Article" }), url),
    []
  )
  assert.deepEqual(extractStructuredMetadata("x".repeat(1_000_001), url), [])
  assert.equal(
    extractStructuredMetadata(
      script({ ...org, description: "x".repeat(4001) }),
      url
    )[0].description,
    null
  )
})

async function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), "enrichment-structured-"))
  const db = openStore(join(dir, "state"), { write: true })
  t.after(() => {
    db.close()
    rmSync(dir, { recursive: true, force: true })
  })
  const file = join(dir, "identity.jsonl")
  writeFileSync(
    file,
    JSON.stringify({
      ein: "123456789",
      organizationName: "Community Example",
      filingAddress: { state: "IL" },
    })
  )
  await importIdentities(db, [file])
  addEvidence(db, "123456789", {
    field: "website",
    value: url,
    source_url: "https://www.irs.gov/",
    observed_at: utc(),
    evidence: "Filed website",
  })
  return { db, claims: claim(db, { worker: "structured-test" }) }
}

test("metadata adds candidate fields without network calls, receipt mutation or trust promotion", async (t) => {
  const { db, claims } = await fixture(t)
  const html =
    "<html><body>Community Example</body>" +
    script({
      ...org,
      description: "ORIGINAL description.",
      logo: "/logo.png",
      sameAs: ["https://instagram.com/community"],
      telephone: "312-555-0100",
      email: "office@provider.example.org",
    }) +
    "</html>"
  const calls = []
  const options = {
    sleep: async () => {},
    resolveHostname: async () => [{ address: "93.184.216.34", family: 4 }],
    transport: async ({ url: requestUrl }) => {
      calls.push(requestUrl)
      const robots = requestUrl.endsWith("robots.txt")
      return {
        status: 200,
        headers: { "content-type": robots ? "text/plain" : "text/html" },
        body: Buffer.from(robots ? "User-agent: *\nAllow: /" : html),
      }
    },
  }
  const plan = planCrawl(db, claims)
  const report = await crawl(db, plan, plan.hash, options)
  assert.equal(calls.length, 2)
  assert.ok(
    report.structuredRetainedBytes > 0 &&
      report.structuredRetainedBytes <= plan.structuredMetadata.maxRetainedBytes
  )
  const receipts = db
    .prepare("SELECT body FROM runs WHERE kind=? ORDER BY created_at,id")
    .all("receipt:" + plan.hash)
    .map((r) => JSON.parse(r.body))
    .sort((a, b) => a.sequence - b.sequence)
  assert.doesNotThrow(() =>
    validateOwnedCrawlerReceiptChain(receipts, plan.fetch.planHash)
  )
  const provider = receipts.find((r) => r.receiptType === "provider")
  assert.deepEqual(provider.signals.socialAccounts, [])
  assert.equal(
    provider.networkEvents.at(-1).contentSha256,
    hash(Buffer.from(html))
  )
  const metadata = JSON.parse(
    db
      .prepare("SELECT body FROM runs WHERE kind=?")
      .get("structured:" + plan.hash).body
  )
  assert.equal(metadata.receiptHash, provider.receiptHash)
  assert.equal(metadata.contentSha256, hash(Buffer.from(html)))
  assert.deepEqual(metadata.organizations[0].emails, [
    "office@provider.example.org",
  ])
  const evidence = evidenceFor(db, "123456789")
  const added = evidence.filter((r) => r.body.method === METADATA_METHOD)
  assert.deepEqual(added.map((r) => r.field).sort(), [
    "description",
    "logo",
    "phone",
    "social_profiles",
  ])
  assert.ok(added.every((r) => r.state === "candidate"))
  assert.equal(
    added.find((r) => r.field === "description").value,
    "ORIGINAL description."
  )
  const replay = planCrawl(db, claims)
  assert.equal(
    (await crawl(db, replay, replay.hash, options)).networkRequests,
    0
  )
  assert.equal(calls.length, 2)
  assert.deepEqual(evidenceFor(db, "123456789"), evidence)
})

test("metadata is not retained when provider fetch is blocked or parked", async (t) => {
  const { db, claims } = await fixture(t)
  const plan = planCrawl(db, claims)
  const report = await crawl(db, plan, plan.hash, {
    sleep: async () => {},
    resolveHostname: async () => [{ address: "93.184.216.34", family: 4 }],
    transport: async ({ url: requestUrl }) => ({
      status: 200,
      headers: {
        "content-type": requestUrl.endsWith("robots.txt")
          ? "text/plain"
          : "text/html",
      },
      body: Buffer.from(
        requestUrl.endsWith("robots.txt")
          ? "User-agent: *\nAllow: /"
          : "<title>Domain for sale</title><p>This domain is for sale. Buy now.</p>" +
              script({ ...org, logo: "/sale.png" })
      ),
    }),
  })
  assert.equal(report.structuredRetainedBytes, 0)
  assert.ok(
    !evidenceFor(db, "123456789").some((r) => r.body.method === METADATA_METHOD)
  )
})

test("structured metadata is bounded, content-bound and absent for robots denial", async (t) => {
  const { db, claims } = await fixture(t)
  const plan = planCrawl(db, claims)
  assert.throws(
    () =>
      createStructuredCollector(db, {
        ...plan,
        structuredMetadata: {
          ...plan.structuredMetadata,
          maxRetainedBytes: 999999,
        },
      }),
    /budget/
  )
  const collector = createStructuredCollector(db, plan)
  const html = script({ ...org, logo: "/logo.png" })
  collector.capture(
    { url },
    {
      status: 200,
      headers: { "content-type": "text/html" },
      body: Buffer.from(html),
    }
  )
  collector.retain({
    receiptType: "provider",
    status: "fetched",
    finalUrl: url,
    networkEvents: [
      { phase: "provider", url, contentSha256: "different-response" },
    ],
  })
  assert.equal(collector.retainedBytes, 0)
  let calls = 0
  await crawl(db, plan, plan.hash, {
    resolveHostname: async () => [{ address: "93.184.216.34", family: 4 }],
    transport: async ({ url: requested }) => {
      calls++
      assert.ok(requested.endsWith("robots.txt"))
      return {
        status: 200,
        headers: { "content-type": "text/plain" },
        body: Buffer.from("User-agent: *\nDisallow: /"),
      }
    },
  })
  assert.equal(calls, 1)
  assert.equal(
    db
      .prepare("SELECT count(*) n FROM runs WHERE kind=?")
      .get("structured:" + plan.hash).n,
    0
  )
})
