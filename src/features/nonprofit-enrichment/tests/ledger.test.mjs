import { test } from "node:test"
import assert from "node:assert/strict"
import {
  mkdtempSync,
  writeFileSync,
  rmSync,
  existsSync,
  readFileSync,
} from "node:fs"
import { tmpdir, homedir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { execFileSync, execFile } from "node:child_process"
import { openStore, overview, FIELDS } from "../server/store.mjs"
import { importIdentities } from "../server/import.mjs"
import {
  claim,
  complete,
  heartbeat,
  fail,
  evidenceFor,
  addEvidence,
} from "../server/queue.mjs"
import { promisify } from "node:util"
import { exportRecords } from "../server/artifacts.mjs"

const cli = fileURLToPath(new URL("../server/cli.mjs", import.meta.url))
const identity = (ein) => ({
  ein,
  organizationName: `Community Provider ${ein}`,
  filingAddress: { state: "IL", city: "Chicago" },
})
async function fixture(t, count = 2) {
  const dir = mkdtempSync(join(tmpdir(), "enrichment-test-")),
    input = join(dir, "identities.jsonl")
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  writeFileSync(
    input,
    Array.from({ length: count }, (_, i) =>
      JSON.stringify(identity(String(100000000 + i)))
    ).join("\n")
  )
  const state = join(dir, "state"),
    db = openStore(state, { write: true })
  t.after(() => db.close())
  await importIdentities(db, [input], { all: true })
  return { dir, input, state, db }
}
function submission(c, id = "result-1") {
  return {
    id,
    ein: c.ein,
    token: c.token,
    assertions: [],
    unresolved: FIELDS.map((field) => ({
      field,
      reason: "no_supported_evidence",
    })),
  }
}
test("dry-run does not create a ledger", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "enrichment-dry-"))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const state = join(dir, "absent")
  const out = JSON.parse(
    execFileSync(
      process.execPath,
      [cli, "init", "--state", state, "--input", "nonexistent"],
      { encoding: "utf8" }
    )
  )
  assert.equal(out.dryRun, true)
  assert.equal(existsSync(state), false)
})
test("identity import replays and EIN duplicates are idempotent", async (t) => {
  const { db, input, dir } = await fixture(t)
  assert.equal((await importIdentities(db, [input], { all: true })).added, 0)
  const other = join(dir, "duplicate.jsonl")
  writeFileSync(other, JSON.stringify(identity("100000000")))
  await importIdentities(db, [other], { all: true })
  assert.equal(overview(db).organizations, 2)
  assert.equal(overview(db).jobs.pending, 2)
})
test("resume recovers a committed import checkpoint without duplicate jobs", async (t) => {
  const { db, input } = await fixture(t)
  db.prepare(
    "UPDATE sources SET cursor=1,completed=0 WHERE kind='identity'"
  ).run()
  const result = await importIdentities(db, [input], { all: true })
  assert.equal(result.added, 0)
  assert.equal(overview(db).jobs.pending, 2)
})
test("incomplete changed source fails closed", async (t) => {
  const { db, input } = await fixture(t)
  db.prepare("UPDATE sources SET completed=0").run()
  writeFileSync(input, JSON.stringify(identity("200000000")))
  await assert.rejects(
    importIdentities(db, [input], { all: true }),
    /different source bytes/
  )
  assert.equal(claim(db, { worker: "new" }).length, 0)
})
test("separate processes claim disjoint jobs", async (t) => {
  const { state } = await fixture(t, 4)
  const packets = await Promise.all(
    ["a", "b"].map(async (worker) =>
      JSON.parse(
        (
          await promisify(execFile)(
            process.execPath,
            [
              cli,
              "next",
              "--state",
              state,
              "--worker",
              worker,
              "--limit",
              "2",
              "--output",
              join(state, worker + ".json"),
              "--write",
            ],
            { encoding: "utf8" }
          )
        ).stdout
      )
    )
  )
  assert.equal(
    new Set(packets.flatMap((p) => p.claims.map((c) => c.ein))).size,
    4
  )
})
test("expired lease rejects stale worker and a new claim has a new token", async (t) => {
  const { db } = await fixture(t, 1)
  const [old] = claim(db, { worker: "old" })
  db.prepare("UPDATE jobs SET expires_at=0").run()
  const [current] = claim(db, { worker: "new" })
  assert.notEqual(old.token, current.token)
  assert.throws(() => complete(db, submission(old)), /Lease expired/)
  assert.throws(() => heartbeat(db, old.ein, old.token), /Lease expired/)
  assert.equal(complete(db, submission(current)).replayed, false)
})
test("crash/retry exhaustion persists after three claims", async (t) => {
  const { db } = await fixture(t, 1)
  for (let i = 0; i < 3; i++) {
    assert.equal(claim(db, { worker: `w${i}` }).length, 1)
    db.exec("UPDATE jobs SET expires_at=0")
  }
  assert.equal(claim(db, { worker: "fourth" }).length, 0)
  assert.equal(overview(db).jobs.exhausted, 1)
})
test("completion validates all fields and rolls back partial evidence", async (t) => {
  const { db } = await fixture(t, 1),
    [c] = claim(db, { worker: "a" })
  const a = {
    field: "website",
    value: "https://provider.example",
    source_url: "https://provider.example",
    observed_at: new Date().toISOString(),
    evidence: "Provider contact page",
    state: "verified",
    confidence: 1,
  }
  assert.throws(
    () => complete(db, { ...submission(c), assertions: [a], unresolved: [] }),
    /Account for/
  )
  assert.equal(evidenceFor(db, c.ein).length, 0)
  assert.equal(overview(db).jobs.running, 1)
  const s = { ...submission(c), assertions: [a] }
  complete(db, s)
  assert.equal(evidenceFor(db, c.ein)[0].state, "candidate")
  assert.equal(complete(db, s).replayed, true)
  assert.throws(
    () => complete(db, { ...s, unresolved: [] }),
    /different content/
  )
})
test("submission templates cannot masquerade as researched outcomes", async (t) => {
  const { db } = await fixture(t, 1),
    [c] = claim(db, { worker: "a" })
  const s = submission(c)
  s.unresolved[0].reason = "REPLACE_WITH_RESEARCH_OUTCOME"
  assert.throws(() => complete(db, s), /Invalid unresolved/)
})
test("retry records backoff; terminal failure is not claimed", async (t) => {
  const { db } = await fixture(t, 1),
    [c] = claim(db, { worker: "a" })
  assert.equal(fail(db, c.ein, c.token, "timeout").status, "retry")
  assert.equal(claim(db, { worker: "b" }).length, 0)
  db.exec("UPDATE jobs SET next_at=0")
  const [next] = claim(db, { worker: "b" })
  fail(db, next.ein, next.token, "unsupported_input", false)
  assert.equal(overview(db).jobs.exhausted, 1)
})
test("private export is blocked and never overwrites an artifact", async (t) => {
  const { db, dir } = await fixture(t, 1),
    out = join(dir, "export.jsonl")
  assert.equal(exportRecords(db, out).records, 1)
  assert.equal(
    JSON.parse(readFileSync(out, "utf8")).publicDisplayEligible,
    false
  )
  assert.throws(() => exportRecords(db, out), /Export exists/)
})

test("export crosses keyset pages with retained evidence without missing rows", async (t) => {
  const { db, dir } = await fixture(t, 1203)
  addEvidence(db, "100000999", {
    field: "phone",
    value: "3125550100",
    source_url: "https://example.org",
    observed_at: new Date().toISOString(),
    evidence: "Public contact",
  })
  const path = join(dir, "multi-page.jsonl")
  assert.equal(exportRecords(db, path).records, 1203)
  const rows = readFileSync(path, "utf8").trim().split("\n").map(JSON.parse)
  assert.equal(new Set(rows.map((r) => r.ein)).size, 1203)
  assert.equal(rows.find((r) => r.ein === "100000999").assertions.length, 1)
})

test("checkpoint and live handoff work from an unrelated directory at later progress", async (t) => {
  const { db, state } = await fixture(t, 3)
  const [first] = claim(db, { worker: "earlier-chat" })
  complete(db, submission(first))
  const [active] = claim(db, { worker: "still-running" })
  const result = JSON.parse(
    execFileSync(
      process.execPath,
      [cli, "checkpoint", "--state", state, "--write"],
      { cwd: tmpdir(), encoding: "utf8" }
    )
  )
  assert.equal(result.status.processedOrganizations, 1)
  assert.ok(
    readFileSync(join(state, "RESUME.md"), "utf8").includes(
      "Never restart from record one"
    )
  )
  const live = JSON.parse(
    execFileSync(process.execPath, [cli, "handoff", "--state", state], {
      cwd: tmpdir(),
      encoding: "utf8",
    })
  )
  assert.equal(live.activeWorkers[0].ein, active.ein)
  assert.equal(live.status.jobs.pending, 1)
  assert.equal(live.stateDirectory, state)
  assert.ok(
    live.runtime.cli.endsWith(
      "src/features/nonprofit-enrichment/server/cli.mjs"
    )
  )
  assert.equal(
    JSON.parse(readFileSync(join(state, "CURRENT.json"), "utf8")).status
      .organizations,
    3
  )
  assert.ok(existsSync(result.checkpoint))
})

test("default state is independent of the current workstream without touching the database", () => {
  const result = JSON.parse(
    execFileSync(process.execPath, [cli, "init"], {
      cwd: tmpdir(),
      env: { ...process.env, NONPROFIT_ENRICHMENT_HOME: "" },
      encoding: "utf8",
    })
  )
  assert.equal(result.dryRun, true)
  assert.equal(
    result.state,
    join(homedir(), ".local/share/coach-house/nonprofit-enrichment")
  )
})
