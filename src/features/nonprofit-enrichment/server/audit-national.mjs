import { mkdirSync } from "node:fs"
import { join, resolve } from "node:path"
import { withAuditContext } from "./audit-context.mjs"
import { auditPublication } from "./publication-audit.mjs"
import { prepareDirectory } from "./directory-projection.mjs"
import { privateWrite } from "./artifacts.mjs"
import { utc } from "./store.mjs"

// Each completion file is an immutable resume boundary, even if a later batch
// fails. Resume into a new directory after the last completed batch's lastEin.
export async function auditNational(db, options) {
  const {
    output,
    inputs,
    after = "",
    limit = 50000,
    now = Date.now(),
    codeRevision = null,
    onProgress = () => {},
    shouldStop = () => false,
  } = options
  if (!output || !inputs?.length) throw new Error("Audit input/output required")
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 50000)
    throw new Error("Audit limit must be 1..50000")
  if (after !== "" && !/^\d{9}$/.test(after))
    throw new Error("Invalid audit cursor")
  const root = resolve(output)
  mkdirSync(root, { mode: 0o700 })
  const startedAt = utc(),
    batches = []
  return withAuditContext(db, { inputs, now, onProgress }, async ({ id }) => {
    privateWrite(join(root, "session.json"), {
      id,
      startedAt,
      after,
      limit,
      codeRevision,
      asOf: new Date(now).toISOString(),
    })
    let cursor = after,
      hasMore = true
    while (hasMore && !shouldStop()) {
      const number = String(batches.length + 1).padStart(3, "0")
      const auditDirectory = join(root, `audit-${number}`)
      const projectionDirectory = join(root, `projection-${number}`)
      const report = await auditPublication(db, {
        inputs,
        output: auditDirectory,
        now,
        codeRevision,
        limit,
        after: cursor,
        onProgress,
      })
      await prepareDirectory(auditDirectory, projectionDirectory)
      cursor = report.selection.lastEin
      hasMore = report.selection.hasMore
      const batch = {
        number,
        auditDirectory,
        projectionDirectory,
        after: report.selection.after,
        lastEin: cursor,
        hasMore,
        organizations: report.organizations,
        directoryEligible: report.directoryEligible,
        completedAt: utc(),
      }
      privateWrite(join(root, `completed-${number}.json`), batch)
      batches.push(batch)
      onProgress({ phase: "batch_completed", ...batch })
      // Permit signal handlers between synchronous database-heavy partitions.
      await new Promise((done) => setImmediate(done))
    }
    const result = {
      id,
      startedAt,
      completedAt: utc(),
      batches,
      after,
      lastEin: cursor,
      hasMore,
      stopped: hasMore,
      organizations: batches.reduce((n, b) => n + b.organizations, 0),
      directoryEligible: batches.reduce((n, b) => n + b.directoryEligible, 0),
      published: 0,
    }
    privateWrite(join(root, "result.json"), result)
    return result
  })
}
