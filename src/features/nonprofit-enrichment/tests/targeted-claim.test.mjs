import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { openStore } from "../server/store.mjs"
import { importIdentities } from "../server/import.mjs"
import { claim } from "../server/queue.mjs"

async function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), "targeted-claim-"))
  const input = join(dir, "identities.jsonl")
  writeFileSync(
    input,
    ["100000000", "100000001"]
      .map((ein) =>
        JSON.stringify({ ein, organizationName: `Provider ${ein}` })
      )
      .join("\n")
  )
  const db = openStore(join(dir, "state"), { write: true })
  t.after(() => {
    db.close()
    rmSync(dir, { recursive: true, force: true })
  })
  await importIdentities(db, [input], { all: true })
  return db
}

test("targeted claims use an EIN lookup and leave other jobs pending", async (t) => {
  const db = await fixture(t)
  let plan
  const observed = new Proxy(db, {
    get(target, key) {
      if (key === "prepare")
        return (sql) => {
          const statement = target.prepare(sql)
          if (!sql.startsWith("SELECT j.ein,o.identity")) return statement
          return {
            all(...args) {
              plan = target.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...args)
              return statement.all(...args)
            },
          }
        }
      const value = target[key]
      return typeof value === "function" ? value.bind(target) : value
    },
  })
  const selected = claim(observed, {
    worker: "exact",
    ein: "100000001",
    limit: 25,
  })
  assert.deepEqual(
    selected.map((row) => row.ein),
    ["100000001"]
  )
  assert.ok(plan.some((row) => /SEARCH j .*\(ein=\?\)/.test(row.detail)))
  assert.equal(
    db.prepare("SELECT status FROM jobs WHERE ein='100000000'").get().status,
    "pending"
  )
  assert.deepEqual(claim(db, { worker: "other", ein: "100000001" }), [])
  assert.deepEqual(claim(db, { worker: "missing", ein: "999999999" }), [])
  assert.deepEqual(
    claim(db, { worker: "ordered" }).map((row) => row.ein),
    ["100000000"]
  )
})

test("targeted claims retain source, retry, attempt and status gates", async (t) => {
  const db = await fixture(t)
  const ein = "100000001",
    now = Date.now()
  for (const change of [
    "UPDATE sources SET completed=0",
    "UPDATE jobs SET attempts=3",
    `UPDATE jobs SET next_at=${now + 10000}`,
    "UPDATE jobs SET status='partially_succeeded'",
    "UPDATE jobs SET status='exhausted'",
  ]) {
    db.exec(
      "UPDATE sources SET completed=1; UPDATE jobs SET status='pending',attempts=0,next_at=0"
    )
    db.exec(change)
    assert.deepEqual(claim(db, { worker: "blocked", ein, now }), [])
  }
  db.exec("UPDATE jobs SET status='retry',attempts=1,next_at=0")
  assert.equal(claim(db, { worker: "retry", ein, now })[0].ein, ein)
})
