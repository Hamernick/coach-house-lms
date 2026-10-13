import assert from "node:assert/strict"
import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { gzipSync } from "node:zlib"
import { hash } from "../server/store.mjs"

const publicFields = [
  "ein",
  "name",
  "city",
  "state",
  "postalCode",
  "website",
  "phone",
  "description",
  "websiteBasis",
  "websiteSourcePeriod",
  "phoneBasis",
  "phoneSourcePeriod",
  "descriptionSourcePeriod",
]
const quote = (value) => "'" + String(value).replace(/'/g, "''") + "'"

// Opt-in real-data measurement in the disposable SQL contract-test database only.
export function benchmarkDirectory(sql, path, reportPath) {
  const raw = readFileSync(path, "utf8")
  const manifest = JSON.parse(
    readFileSync(join(dirname(path), "projection.json"), "utf8")
  )
  assert.equal(hash(raw), manifest.recordsHash, "Projection hash mismatch")
  const records = raw.trim().split("\n").map(JSON.parse)
  assert.equal(records.length, manifest.records)
  assert.ok(records.length > 0 && records.length <= 50000)
  let previous = ""
  for (const row of records) {
    assert.match(row.ein, /^\d{9}$/)
    assert.ok(row.ein > previous)
    previous = row.ein
    assert.equal(hash(row.recordText), row.recordDigest)
    const content = JSON.parse(row.recordText)
    assert.equal(content.ein, row.ein)
    assert.ok(Object.keys(content).every((key) => publicFields.includes(key)))
  }
  // Remove synthetic contract fixtures before loading real audited records.
  sql(
    "truncate public.nonprofit_publication_chunks,public.nonprofit_publication_runs,public.nonprofit_directory,public.organizations,public.resource_map_organizations;"
  )
  const batch = "00000000-0000-4000-8000-000000000007"
  const publish = (offset) => {
    const payload = JSON.stringify(
      records
        .slice(offset, offset + 1000)
        .map((r) => ({ ...r, expectedDigest: null }))
    )
    assert.ok(Buffer.byteLength(payload) <= 2_000_000)
    return JSON.parse(
      sql(
        `set role service_role; select public.publish_nonprofit_directory_chunk('${batch}',repeat('b',64),${offset / 1000},${quote(payload)},'abcdefghijklmnopqrst','nonprofit-directory-retained-audit-v1','bounded local audited-cohort test'); reset role;`
      )
    )
  }
  const began = performance.now(),
    outcomes = {}
  for (let offset = 0; offset < records.length; offset += 1000) {
    for (const row of publish(offset).outcomes)
      outcomes[row.status] = (outcomes[row.status] ?? 0) + 1
  }
  const insertSeconds = (performance.now() - began) / 1000
  assert.equal(outcomes.inserted, records.length)
  // New psql connection replays the exact first/last committed chunk, simulating
  // lost acknowledgments across a client restart, without duplicating any row.
  for (const offset of new Set([
    0,
    Math.floor((records.length - 1) / 1000) * 1000,
  ])) {
    assert.equal(publish(offset).replayed, true)
  }
  assert.equal(
    Number(sql("select count(*) from public.nonprofit_directory;")),
    records.length
  )
  const digest = hash(
    records.map((r) => `${r.ein}:${r.recordDigest}\n`).join("")
  )
  assert.equal(
    sql(
      "select encode(sha256(convert_to(string_agg(ein||':'||record_digest||E'\\n','' order by ein),'UTF8')),'hex') from public.nonprofit_directory;"
    ).trim(),
    digest
  )
  sql("analyze public.nonprofit_directory;")
  const queries = {},
    fields = new Set([...publicFields, "operatingStatus", "listingType"])
  let maxCompressedResponseBytes = 0
  for (const query of [
    "food",
    "community",
    "church",
    "health",
    "zzzzunmatchedterm",
  ]) {
    const timings = []
    let lastResult
    for (let i = 0; i < 20; i++) {
      const start = performance.now()
      lastResult = JSON.parse(
        sql(
          `set role anon; select public.search_nonprofit_directory(${quote(query)},null,null,20); reset role;`
        )
      )
      timings.push(performance.now() - start)
      assert.ok(lastResult.length <= 20)
      for (const item of lastResult) {
        assert.ok(Object.keys(item).every((key) => fields.has(key)))
        assert.equal(item.operatingStatus, "unknown")
      }
      maxCompressedResponseBytes = Math.max(
        maxCompressedResponseBytes,
        gzipSync(JSON.stringify(lastResult)).length
      )
    }
    timings.sort((a, b) => a - b)
    queries[query] = { p95Ms: timings[18], results: lastResult.length }
  }
  const page = (after) =>
    JSON.parse(
      sql(
        `set role anon; select public.search_nonprofit_directory('',null,${after ? quote(after) : "null"},20); reset role;`
      )
    )
  const first = page(null),
    second = page(first.at(-1).ein)
  assert.deepEqual(
    [...first, ...second].map((r) => r.ein),
    records.slice(0, 40).map((r) => r.ein)
  )
  const sample = JSON.parse(records[0].recordText)
  const detail = JSON.parse(
    sql(
      `set role anon; select public.get_nonprofit_directory(${quote(sample.ein)}); reset role;`
    )
  )
  for (const key of publicFields) assert.equal(detail[key], sample[key])
  const storage = JSON.parse(
    sql(
      `select jsonb_build_object('directory',pg_total_relation_size('public.nonprofit_directory'),'receipts',pg_total_relation_size('public.nonprofit_publication_chunks'),'runs',pg_total_relation_size('public.nonprofit_publication_runs'));`
    )
  )
  const report = {
    environment:
      "isolated local PostgreSQL; warm sequential psql reads include process startup; not production, concurrent or national-capacity proof",
    completedAt: new Date().toISOString(),
    projectionHash: manifest.recordsHash,
    records: records.length,
    outcomes,
    insertSeconds,
    storage,
    queries,
    maxCompressedResponseBytes,
    recordDigest: digest,
    checks: {
      projectionAllowlist: true,
      exactCountAndDigests: true,
      replay: true,
      pagination: true,
      anonymousDetail: true,
    },
    publicWrites: 0,
  }
  if (reportPath)
    writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", {
      flag: "wx",
      mode: 0o600,
    })
  console.log(JSON.stringify(report))
}
