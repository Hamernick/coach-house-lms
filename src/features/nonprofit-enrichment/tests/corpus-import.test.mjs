import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { DatabaseSync } from "node:sqlite"
import { openStore, stable } from "../server/store.mjs"
import { migrateCorpus } from "../server/corpus-migrations.mjs"
import { inventoryCorpus } from "../server/corpus-inventory.mjs"
import { importCorpus } from "../server/corpus-import.mjs"
import { importIdentities } from "../server/import.mjs"
import { claim } from "../server/queue.mjs"

const header = "EIN,NAME,STREET,CITY,STATE,ZIP,STATUS\n"
const row = (ein, name = "Food Center") =>
  `${ein},${name},123 Main,Town,IL,60000,01\n`
async function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), "corpus-import-")),
    home = join(dir, "state")
  const db = openStore(home, { write: true })
  t.after(() => {
    db.close()
    rmSync(dir, { recursive: true, force: true })
  })
  const input = join(dir, "existing.jsonl")
  writeFileSync(
    input,
    JSON.stringify({
      ein: "012345678",
      organizationName: "Food Center",
      retained: true,
    })
  )
  await importIdentities(db, [input], { all: true })
  db.prepare(
    "UPDATE jobs SET status='partially_succeeded',attempts=2,reason='keep history'"
  ).run()
  const a = join(dir, "a.csv"),
    b = join(dir, "b.csv")
  writeFileSync(
    a,
    header + row("012345678") + row("123456789") + row("234567890")
  )
  writeFileSync(b, header + row("123456789") + row("000000000"))
  const manifest = await inventoryCorpus([a, b])
  return { dir, home, db, a, b, manifest }
}

test("migration verifies a restorable backup and replays without touching research", async (t) => {
  const f = await fixture(t),
    before = stable(f.db.prepare("SELECT * FROM jobs").all())
  const backup = join(f.dir, "backup.sqlite")
  assert.equal(migrateCorpus(f.db, backup).backupVerified, true)
  const restored = new DatabaseSync(backup, { readOnly: true })
  assert.equal(stable(restored.prepare("SELECT * FROM jobs").all()), before)
  assert.equal(
    restored.prepare("SELECT value FROM meta WHERE key='corpus_schema'").get(),
    undefined
  )
  restored.close()
  assert.equal(migrateCorpus(f.db, backup).migrated, false)
  assert.equal(stable(f.db.prepare("SELECT * FROM jobs").all()), before)
})

test("bounded import resumes, reconciles duplicates/rejections and preserves existing jobs/identity", async (t) => {
  const f = await fixture(t)
  migrateCorpus(f.db, join(f.dir, "backup.sqlite"))
  const before = stable(
    f.db.prepare("SELECT * FROM organizations WHERE ein='012345678'").get()
  )
  const job = stable(
    f.db.prepare("SELECT * FROM jobs WHERE ein='012345678'").get()
  )
  let result = await importCorpus(f.db, f.manifest, f.home, { limit: 2 })
  assert.equal(result.status, "running")
  assert.equal(result.inputRows, 2)
  assert.equal(claim(f.db, { worker: "test" }).length, 0) // incomplete source cannot enter research
  // Resume from retained bytes even if the original download is replaced.
  writeFileSync(f.a, "changed original")
  result = await importCorpus(f.db, f.manifest, f.home, { limit: 10 })
  assert.equal(result.status, "completed")
  assert.equal(result.inputRows, 5)
  assert.equal(result.acceptedRows, 4)
  assert.equal(result.rejectedRows, 1)
  assert.equal(result.uniqueEins, 3)
  assert.equal(result.duplicateRows, 1)
  assert.equal(
    stable(
      f.db.prepare("SELECT * FROM organizations WHERE ein='012345678'").get()
    ),
    before
  )
  assert.equal(
    stable(f.db.prepare("SELECT * FROM jobs WHERE ein='012345678'").get()),
    job
  )
  result = await importCorpus(f.db, f.manifest, f.home, { limit: 10 })
  assert.equal(result.addedThisRun, 0)
  assert.equal(result.scannedThisRun, 0)
  assert.equal(
    f.db.prepare("SELECT count(*) n FROM identity_observations").get().n,
    4
  )
})

test("changed inventory bytes fail before identity writes; retained corruption also fails closed", async (t) => {
  const f = await fixture(t)
  migrateCorpus(f.db, join(f.dir, "backup.sqlite"))
  writeFileSync(f.b, header + row("999999999"))
  await assert.rejects(
    importCorpus(f.db, f.manifest, f.home),
    /Source bytes differ/
  )
  assert.equal(f.db.prepare("SELECT count(*) n FROM organizations").get().n, 1)
  const retained = join(
    f.home,
    "sources",
    "bmf",
    `${f.manifest.sources[0].sha256}.csv`
  )
  writeFileSync(retained, "corrupted")
  await assert.rejects(
    importCorpus(f.db, f.manifest, f.home),
    /Retained source hash mismatch/
  )
})

test("a later changed observation is retained as conflict, never last-download-wins", async (t) => {
  const f = await fixture(t)
  migrateCorpus(f.db, join(f.dir, "backup.sqlite"))
  await importCorpus(f.db, f.manifest, f.home)
  writeFileSync(f.a, header + row("123456789", "Different Name"))
  const changed = await inventoryCorpus([f.a])
  const result = await importCorpus(f.db, changed, f.home)
  assert.equal(result.identityConflictEins, 1)
  assert.equal(
    JSON.parse(
      f.db
        .prepare("SELECT identity FROM organizations WHERE ein='123456789'")
        .get().identity
    ).organizationName,
    "Food Center"
  )
  assert.equal(
    f.db
      .prepare(
        "SELECT count(*) n FROM identity_observations WHERE ein='123456789'"
      )
      .get().n,
    3
  )
})

test("crash after a committed chunk resumes without duplicating observations", async (t) => {
  const f = await fixture(t)
  migrateCorpus(f.db, join(f.dir, "backup.sqlite"))
  await assert.rejects(
    importCorpus(f.db, f.manifest, f.home, {
      limit: 2,
      onProgress: () => {
        throw new Error("crash")
      },
    }),
    /crash/
  )
  assert.equal(
    f.db.prepare("SELECT count(*) n FROM identity_observations").get().n,
    2
  )
  const resumed = await importCorpus(f.db, f.manifest, f.home)
  assert.equal(resumed.status, "completed")
  assert.equal(resumed.acceptedRows, 4)
})

test("inventory with a shortened row count cannot mark a partial source complete", async (t) => {
  const f = await fixture(t)
  migrateCorpus(f.db, join(f.dir, "backup.sqlite"))
  const manifest = JSON.parse(JSON.stringify(f.manifest))
  manifest.sources[0].rows = 2
  await assert.rejects(
    importCorpus(f.db, manifest, f.home, { limit: 2 }),
    /row count differs/
  )
  assert.equal(
    f.db
      .prepare(
        "SELECT count(*) n FROM sources WHERE kind='identity_bmf' AND completed=1"
      )
      .get().n,
    0
  )
  assert.ok(readFileSync(join(f.home, "research.sqlite")).length)
})
