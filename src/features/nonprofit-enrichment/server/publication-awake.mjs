import { spawn } from "node:child_process"
import { once } from "node:events"

// Process-scoped macOS assertions; never change persistent power settings.
// Lid closure, forced sleep and power loss still require stopping/revalidation.
export async function keepPublicationAwake({
  platform = process.platform,
  pid = process.pid,
  spawnImpl = spawn,
} = {}) {
  if (platform !== "darwin")
    return { supported: false, assertActive() {}, release() {} }
  const child = spawnImpl("/usr/bin/caffeinate", ["-is", "-w", String(pid)], {
    stdio: "ignore",
  })
  let failed = false, released = false
  child.on("error", () => { failed = true })
  child.on("exit", () => { failed = true })
  await once(child, "spawn")
  return {
    supported: true,
    assertActive() {
      if (failed || released)
        throw new Error("Publication keep-awake assertion ended; stopped before write")
    },
    release() {
      if (!released) { released = true; child.kill("SIGTERM") }
    },
  }
}
