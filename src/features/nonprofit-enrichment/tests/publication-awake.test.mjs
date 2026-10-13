import { test } from "node:test"
import assert from "node:assert/strict"
import { EventEmitter } from "node:events"
import { keepPublicationAwake } from "../server/publication-awake.mjs"

test("macOS assertions follow only the publisher PID and are explicitly released", async () => {
  const child = new EventEmitter(), kills = []
  child.kill = signal => kills.push(signal)
  const awake = await keepPublicationAwake({ platform: "darwin", pid: 123, spawnImpl: (bin, args, options) => {
    assert.equal(bin, "/usr/bin/caffeinate")
    assert.deepEqual(args, ["-is", "-w", "123"])
    assert.equal(options.stdio, "ignore")
    process.nextTick(() => child.emit("spawn"))
    return child
  } })
  awake.assertActive()
  awake.release(); awake.release()
  assert.deepEqual(kills, ["SIGTERM"])
  assert.throws(() => awake.assertActive(), /stopped before write/)
})

test("unexpected assertion exit or error blocks subsequent publication", async () => {
  for (const event of ["exit", "error"]) {
    const child = new EventEmitter()
    child.kill = () => {}
    const awake = await keepPublicationAwake({ platform: "darwin", spawnImpl: () => {
      process.nextTick(() => child.emit("spawn")); return child
    } })
    child.emit(event, event === "error" ? new Error("failed") : 1)
    assert.throws(() => awake.assertActive(), /stopped before write/)
    awake.release()
  }
})

test("failure to start the assertion rejects startup; other systems do not spawn it", async () => {
  await assert.rejects(keepPublicationAwake({ platform: "darwin", spawnImpl: () => {
    const child = new EventEmitter()
    process.nextTick(() => child.emit("error", new Error("ENOENT")))
    return child
  } }), /ENOENT/)
  const awake = await keepPublicationAwake({ platform: "linux", spawnImpl: () => { throw new Error("unexpected spawn") } })
  assert.equal(awake.supported, false)
  awake.assertActive(); awake.release()
})
