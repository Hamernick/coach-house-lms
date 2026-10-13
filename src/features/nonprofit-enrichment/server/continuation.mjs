import { homedir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { execFileSync } from "node:child_process"
import { renameSync } from "node:fs"
import { randomUUID } from "node:crypto"
import { overview, utc } from "./store.mjs"
import { privateWrite } from "./artifacts.mjs"

export const defaultStateDirectory = () =>
  join(homedir(), ".local/share/coach-house/nonprofit-enrichment")
const codeDirectory = fileURLToPath(new URL("../../../../", import.meta.url))
function git(...args) {
  try {
    return execFileSync("git", ["-C", codeDirectory, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim()
  } catch {
    return null
  }
}
// Audit metadata needs Git only; avoid a national jobs/evidence census per batch.
export const codeRevision = () => git("rev-parse", "HEAD")

export function continuation(db, home) {
  const now = Date.now()
  const active = db
    .prepare(
      "SELECT ein,worker,expires_at FROM jobs WHERE status='running' AND expires_at>? ORDER BY expires_at LIMIT 25"
    )
    .all(now)
  const ready = db
    .prepare(
      `SELECT j.ein FROM jobs j WHERE status IN ('pending','retry') AND next_at<=? AND attempts<3
    AND EXISTS(SELECT 1 FROM evidence e WHERE e.ein=j.ein AND field='website' AND state IN ('candidate','verified')) ORDER BY j.ein LIMIT 25`
    )
    .all(now)
  const imports = db
    .prepare(
      "SELECT kind,path,cursor FROM sources WHERE completed=0 ORDER BY observed_at LIMIT 10"
    )
    .all()
  return {
    generatedAt: utc(),
    stateDirectory: resolve(home),
    runtime: {
      codeDirectory,
      cli: join(
        codeDirectory,
        "src/features/nonprofit-enrichment/server/cli.mjs"
      ),
      node: process.execPath,
      repository: git(
        "rev-parse",
        "--path-format=absolute",
        "--git-common-dir"
      ),
      branch: git("branch", "--show-current"),
      commit: git("rev-parse", "HEAD"),
      dirty: Boolean(git("status", "--porcelain")),
    },
    status: overview(db),
    activeWorkers: active,
    unfinishedImports: imports,
    readyForWebsiteResearch: ready,
    instructions: [
      "Read current AGENTS.md, docs/plans/nonprofit-enrichment-continuation.md and its linked current plan in the located checkout. The current open workstream need not be the data workstream.",
      "Keep this state directory. Progress comes from the live ledger, never an old chat, checkpoint count or fixed milestone.",
      "Do not steal live claims. Expired claims are recovered by next with a new token; retry only when eligible.",
      "Follow the current implementation checklist and live ledger. Resume unfinished immutable imports; prioritize bulk sources and eligible directory publication before new individual research.",
      "Research bounded batches and complete through the CLI. Skip fresh verified fields, reuse pages, preserve candidates/conflicts and record unresolved reasons.",
      "After crawling, run verify-retained --ein <EIN> --write before classification/completion; trust the returned evidence rules, not agent confidence.",
      "After a batch, run checkpoint --write. Do not automatically requeue completed records without new evidence or a recorded reason.",
      "No paid services. Public writes require an activated target/policy and exact confirmed publication manifest. Report research progress separately from target-database publication receipts and live search checks; research overview zeroes are not a production census.",
    ],
  }
}
function replacePrivate(path, body) {
  const temp = `${path}.${randomUUID()}.tmp`
  privateWrite(temp, body)
  renameSync(temp, path)
}
export function checkpoint(db, home) {
  const data = continuation(db, home)
  const snapshot = join(
    home,
    "checkpoints",
    `${data.generatedAt.replaceAll(":", "-")}-${randomUUID()}.json`
  )
  privateWrite(snapshot, data)
  replacePrivate(join(home, "CURRENT.json"), data)
  const runtime = data.runtime
  const recovery = runtime.repository
    ? dirname(runtime.repository)
    : codeDirectory
  const text = `# Resume nonprofit enrichment from any chat or workstream

Permanent state directory: ${resolve(home)}

This file is an entry point, not a frozen task list. Read CURRENT.json to locate the latest known code and its Git repository. Then run the live handoff command below. The live ledger is authoritative whether 100 or 500,000 organizations have been processed. Counts and paths in older chats can be stale.

## Locate the code

Latest known code: ${runtime.codeDirectory}
Latest known branch: ${runtime.branch}
Latest committed revision: ${runtime.commit}
Uncommitted changes when checkpointed: ${runtime.dirty}
Git repository: ${recovery}

If this checkout is gone, inspect git worktree list and the recorded branch in that repository. Use an existing checkout containing src/features/nonprofit-enrichment/server/cli.mjs, or create an isolated worktree from that branch (recorded commit is a fallback). Do not switch or overwrite unrelated work. Code recovery does not replace or initialize the research database. Node >=22.13 is required; the last working executable was ${runtime.node}.

## Read live progress

From any directory, invoke the located CLI by absolute path:

    <node-22+> <code-directory>/src/features/nonprofit-enrichment/server/cli.mjs handoff --state ${resolve(home)}

Read that checkout's AGENTS.md and docs/agent/nonprofit-enrichment-runbook.md. Follow unfinished imports, eligible claims and missing evidence in the live handoff. Preserve active workers and recover expired leases through the CLI. Never restart from record one or reinitialize the ledger. Use a unique worker ID, small bounded batches, saved evidence and shared caches. If a stage is unsupported, make the smallest source-specific improvement and test it before scaling.

After each batch, run checkpoint --state <this-directory> --write from the located CLI. This refreshes CURRENT.json and this entry point. Keep periodic SQLite backups; Git stores code, not data. Do not delete this directory when retiring a workstream.

No paid services. Unknown is acceptable. Candidate enrichment is not verification; verification is not publication. Directory publication requires an activated target/policy and exact confirmed manifest. Read docs/plans/nonprofit-enrichment-continuation.md before choosing the next action; do not restart older research milestones.
`
  replacePrivate(join(home, "RESUME.md"), text)
  return {
    checkpoint: snapshot,
    entrypoint: join(home, "RESUME.md"),
    stateDirectory: resolve(home),
    status: data.status,
  }
}
