#!/usr/bin/env node
import { readFileSync, statSync, chmodSync, existsSync } from "node:fs"
import { join, resolve } from "node:path"
import { parseArgs } from "node:util"
import {
  openStore,
  overview,
  FIELDS,
  utc,
  transaction,
  event,
} from "./store.mjs"
import { importIdentities } from "./import.mjs"
import {
  claim,
  complete,
  heartbeat,
  fail,
  evidenceFor,
  missingFields,
} from "./queue.mjs"
import { ingestEvidence } from "./evidence-import.mjs"
import { classifyEvidence } from "./classification.mjs"
import { ingestFilings } from "./filings.mjs"
import { privateWrite, exportRecords } from "./artifacts.mjs"
import {
  continuation,
  codeRevision,
  checkpoint,
  defaultStateDirectory,
} from "./continuation.mjs"
import { verifyRetained } from "./verification.mjs"
import { planCrawl, crawl } from "./crawl.mjs"
import { inventoryCorpus } from "./corpus-inventory.mjs"
import { migrateCorpus } from "./corpus-migrations.mjs"
import { importCorpus } from "./corpus-import.mjs"
import { inventorySources } from "./source-inventory.mjs"
import { auditNational } from "./audit-national.mjs"
import { auditPublication } from "./publication-audit.mjs"
import { prepareDirectory } from "./directory-projection.mjs"
import { publicationClient } from "./publication-client.mjs"
import { planPublication } from "./publication-plan.mjs"
import { publicationHealth } from "./publication-health.mjs"
import { publishDirectory } from "./publisher.mjs"

const booleanOptions = [
  "write",
  "all",
  "network",
  "terminal",
  "help",
  "follow-links",
]
const stringOptions = [
  "state",
  "input",
  "output",
  "sample",
  "limit",
  "after",
  "worker",
  "ein",
  "token",
  "reason",
  "confirm-plan",
  "target",
  "authorization",
  "chunk-size",
]
const { values: args, positionals } = parseArgs({
  allowPositionals: true,
  options: Object.fromEntries([
    ...booleanOptions.map((k) => [k, { type: "boolean" }]),
    ...stringOptions.map((k) => [k, { type: "string" }]),
  ]),
})
const command = positionals[0] ?? "status"
const home = resolve(
  args.state ??
    (process.env.NONPROFIT_ENRICHMENT_HOME || undefined) ??
    defaultStateDirectory()
)
const integer = (key, fallback) => {
  const raw = args[key]
  if (raw === undefined) return fallback
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(Number(raw)))
    throw new Error(`--${key} must be an integer`)
  return Number(raw)
}
function inputJson() {
  if (!args.input || statSync(args.input).size > 5_000_000)
    throw new Error("--input JSON required, at most 5 MB")
  return JSON.parse(readFileSync(args.input, "utf8"))
}
const mutating = new Set([
  "init",
  "next",
  "heartbeat",
  "complete",
  "fail",
  "ingest-filings",
  "plan-crawl",
  "crawl",
  "run",
  "requeue",
  "backup",
  "export",
  "ingest-evidence",
  "classify",
  "verify-retained",
  "checkpoint",
  "inventory",
  "inventory-corpus",
  "migrate-corpus",
  "import-corpus",
  "audit-publication",
  "audit-national",
  "prepare-directory",
  "plan-publish",
  "publish",
])

function usage() {
  return `Private nonprofit enrichment CLI (Node >=22.13, Python 3 for XML only).
Usage: pnpm resource-map:enrich-organizations <command> [options]
Use --state <absolute-directory> in every new chat; default: ${home}
  status | handoff | checkpoint --write | context --ein <EIN>
  init --input <IRS-csv-or-identity-jsonl,...> [--sample 10000 | --all] --write
  ingest-filings --input <XML-file-or-directory,...> [--limit 1000] --write
  ingest-evidence --input <normalized-candidates.jsonl> [--limit 1000] --write
  classify --ein <EIN> --write
  verify-retained --ein <EIN> --write
  inventory-corpus --input <local-BMF.csv,...> --output <new-private.json> --write
  migrate-corpus --output <new-backup.sqlite> --write
  import-corpus --input <saved-corpus-inventory.json> [--limit 10000 | --all] --write
  inventory --output <new-private.json> --write
  audit-national --input <local-IRS-BMF.csv,...> --output <new-private-directory> [--limit 50000] [--after EIN] --write
  audit-publication --input <local-IRS-BMF.csv,...> --output <new-private-directory> [--limit 50000] [--after EIN] --write
  prepare-directory --input <completed-audit-directory> --output <new-projection-directory> --write
  plan-publish --input <projection-directory> --output <new-plan-directory> --target <project-ref> --authorization <reference> [--chunk-size 1000] --network --write
  publish --input <plan-directory> --target <project-ref> --confirm-plan <manifest-hash> --network --write
  next --worker <unique-name> [--ein <EIN>] [--limit 1] --output <new-claim.json> --write
  heartbeat --ein <EIN> --token <claim-token> --write
  complete --input <submission.json> --write
  fail --ein <EIN> --token <claim-token> --reason <text> [--terminal] --write
  plan-crawl --input <claim.json> --output <new-plan.json> [--follow-links] --write
  crawl --input <plan.json> --network --confirm-plan <bundle-hash> --write
  run --worker <unique-name> [--limit 25] --write
  requeue --ein <EIN> --reason <new-evidence-or-policy-change> --write
  export --output <new-private.jsonl> --write
  backup --output <new-backup.sqlite> --write
  handoff --output <new-handoff.json> --write
run is an offline baseline pass; never searches or publishes.
Mutation commands without --write explain the planned action without opening a ledger.
No paid APIs. Public writes require the explicit target-bound publication manifest and an activated database policy.`
}
async function execute(db) {
  switch (command) {
    case "init": {
      if (!args.input) throw new Error("--input required")
      if (args.all && args.sample) throw new Error("Choose --all or --sample")
      return importIdentities(db, args.input.split(","), {
        limit: integer("sample", 10000),
        all: args.all,
      })
    }
    case "status":
      return overview(db)
    case "handoff":
      return continuation(db, home)
    case "checkpoint":
      return checkpoint(db, home)
    case "inventory-corpus":
      if (args.network) throw new Error("Corpus inventory is offline only")
      return inventoryCorpus(args.input?.split(","))
    case "migrate-corpus":
      return migrateCorpus(db, args.output)
    case "import-corpus": {
      if (args.network) throw new Error("Corpus import is offline only")
      if (args.all && args.limit) throw new Error("Choose --all or --limit")
      let stopping = false,
        lastReported = 0
      const stop = () => {
        stopping = true
      }
      process.on("SIGTERM", stop)
      process.on("SIGINT", stop)
      try {
        return await importCorpus(db, inputJson(), home, {
          limit: args.all ? Number.MAX_SAFE_INTEGER : integer("limit", 10000),
          shouldStop: () => stopping,
          onProgress: (progress) => {
            if (progress.scanned - lastReported >= 10000) {
              console.error(JSON.stringify(progress))
              lastReported = progress.scanned
            }
          },
        })
      } finally {
        process.off("SIGTERM", stop)
        process.off("SIGINT", stop)
        checkpoint(db, home)
      }
    }
    case "inventory": {
      const result = await inventorySources(db)
      return {
        sources: result.entries,
        uniqueFiles: result.uniqueFiles,
        ledgerWrites: 0,
        networkRequests: 0,
      }
    }
    case "audit-national": {
      if (args.network) throw new Error("Publication audit is offline only")
      let stopping = false
      const stop = () => {
        stopping = true
      }
      process.on("SIGINT", stop)
      process.on("SIGTERM", stop)
      try {
        return await auditNational(db, {
          inputs: args.input?.split(","),
          output: args.output,
          codeRevision: codeRevision(),
          limit: integer("limit", 50000),
          after: args.after ?? "",
          shouldStop: () => stopping,
          onProgress: (progress) => console.error(JSON.stringify(progress)),
        })
      } finally {
        process.off("SIGINT", stop)
        process.off("SIGTERM", stop)
      }
    }
    case "audit-publication":
      if (args.network) throw new Error("Publication audit is offline only")
      return auditPublication(db, {
        inputs: args.input?.split(","),
        output: args.output,
        codeRevision: codeRevision(),
        limit: integer("limit", 50000),
        after: args.after ?? "",
        onProgress: (progress) => console.error(JSON.stringify(progress)),
      })
    case "prepare-directory":
      if (!args.input) throw new Error("Completed audit --input required")
      return prepareDirectory(args.input, args.output)
    case "plan-publish":
      if (!args.network || !args.input)
        throw new Error("Live preflight requires --network and --input")
      return planPublication(publicationClient(args.target), {
        input: args.input,
        output: args.output,
        target: args.target,
        authorization: args.authorization,
        chunkSize: integer("chunk-size", 1000),
      })
    case "publish": {
      if (!args.network || !args.input || !args["confirm-plan"])
        throw new Error(
          "Publication requires --network, --input and exact --confirm-plan"
        )
      const client = publicationClient(args.target)
      return publishDirectory(client, {
        input: args.input,
        target: args.target,
        confirmation: args["confirm-plan"],
        onChunk: publicationHealth(client, {
          onProgress: (progress) => console.error(JSON.stringify(progress)),
        }),
      })
    }
    case "context": {
      const org = db
        .prepare("SELECT * FROM organizations WHERE ein=?")
        .get(args.ein ?? "")
      if (!org) throw new Error("Unknown EIN")
      return {
        identity: JSON.parse(org.identity),
        job: db.prepare("SELECT * FROM jobs WHERE ein=?").get(args.ein),
        evidence: evidenceFor(db, args.ein),
        missingFields: missingFields(db, args.ein),
        events: db
          .prepare(
            "SELECT * FROM events WHERE ein=? ORDER BY seq DESC LIMIT 20"
          )
          .all(args.ein),
        publicationBlocked: true,
      }
    }
    case "next": {
      const claims = claim(db, {
        worker: args.worker,
        ein: args.ein ?? null,
        limit: integer("limit", 1),
      })
      return {
        claims,
        submissionTemplates: claims.map((c) => ({
          id: `${c.ein}-${c.token}`,
          ein: c.ein,
          token: c.token,
          assertions: [],
          unresolved: c.missingFields.map((field) => ({
            field,
            reason: "REPLACE_WITH_RESEARCH_OUTCOME",
          })),
        })),
        policy: {
          fields: FIELDS,
          externalAssertionsRemainCandidates: true,
          publicationBlocked: true,
        },
      }
    }
    case "heartbeat":
      return heartbeat(db, args.ein, args.token)
    case "complete":
      return complete(db, inputJson())
    case "fail":
      return fail(db, args.ein, args.token, args.reason, !args.terminal)
    case "ingest-filings": {
      if (!args.input) throw new Error("--input required")
      return ingestFilings(db, args.input.split(","), {
        limit: integer("limit", 1000),
      })
    }
    case "ingest-evidence":
      return ingestEvidence(db, args.input, { limit: integer("limit", 1000) })
    case "verify-retained":
      return verifyRetained(db, args.ein)
    case "classify":
      return classifyEvidence(db, args.ein)
    case "plan-crawl":
      return planCrawl(db, inputJson().claims, {
        followLinks: args["follow-links"],
      })
    case "crawl": {
      if (!args.network)
        throw new Error("Crawl requires --network and exact --confirm-plan")
      return crawl(db, inputJson(), args["confirm-plan"])
    }
    case "run": {
      const limit = integer("limit", 25)
      if (limit < 1 || limit > 1000)
        throw new Error("Offline run limit must be 1..1000")
      let processed = 0
      while (processed < limit) {
        const jobs = claim(db, {
          worker: args.worker,
          limit: Math.min(25, limit - processed),
        })
        if (!jobs.length) break
        for (const c of jobs) {
          const assertions = []
          if (c.identity.filingAddress)
            assertions.push({
              field: "filing_address",
              value: c.identity.filingAddress,
              source_url:
                "https://www.irs.gov/charities-non-profits/exempt-organizations-business-master-file-extract-eo-bmf",
              observed_at: utc(),
              evidence: JSON.stringify({
                filingAddress: c.identity.filingAddress,
                source: "imported_identity_snapshot",
              }),
              method: "irs_identity_baseline_v1",
              source_type: "irs_eo_bmf",
            })
          const covered = new Set(assertions.map((a) => a.field))
          complete(db, {
            id: `baseline-${c.token}`,
            ein: c.ein,
            token: c.token,
            assertions,
            unresolved: c.missingFields
              .filter((f) => !covered.has(f))
              .map((field) => ({
                field,
                reason: "offline_pass_only_needs_source_evidence",
              })),
          })
          processed++
        }
      }
      return {
        processed,
        networkRequests: 0,
        modelCalls: 0,
        publicationBlocked: true,
      }
    }
    case "requeue":
      return transaction(db, () => {
        if (!args.reason || args.reason.length > 500)
          throw new Error("Provide bounded --reason for requeue")
        const job = db
          .prepare("SELECT * FROM jobs WHERE ein=?")
          .get(args.ein ?? "")
        if (!job || job.status === "running")
          throw new Error("Unknown or running job; finish/fail its lease first")
        db.prepare(
          "UPDATE jobs SET status='pending',attempts=0,next_at=0,reason=?,updated_at=? WHERE ein=?"
        ).run(args.reason, utc(), args.ein)
        event(db, args.ein, "requeued", {
          reason: args.reason,
          previousAttempts: job.attempts,
        })
        return { ein: args.ein, status: "pending" }
      })
    case "export":
      return exportRecords(db, args.output)
    case "backup": {
      if (!args.output || existsSync(args.output))
        throw new Error("Provide a new backup --output path")
      db.prepare("VACUUM INTO ?").run(resolve(args.output))
      chmodSync(resolve(args.output), 0o600)
      return { backup: resolve(args.output) }
    }
    default:
      throw new Error(`Unknown command: ${command}`)
  }
}
async function main() {
  process.umask(0o077)
  if (args.help) {
    console.log(usage())
    return
  }
  if (mutating.has(command) && !args.write) {
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          command,
          state: home,
          networkRequests: 0,
          publicationBlocked: true,
          next: "Add --write to execute this local operation; crawl additionally needs --network and its exact plan hash",
        },
        null,
        2
      )
    )
    return
  }
  if (
    [
      "next",
      "plan-crawl",
      "export",
      "inventory",
      "inventory-corpus",
      "migrate-corpus",
      "audit-publication",
      "audit-national",
      "prepare-directory",
      "plan-publish",
    ].includes(command) &&
    !args.output
  )
    throw new Error("--output required for durable private artifact")
  if (args.output && !args.write)
    throw new Error("Writing an output requires --write")
  if (args.output && existsSync(args.output) && command !== "migrate-corpus")
    throw new Error("Output exists; choose a new artifact path")
  const fileOnly = [
    "inventory",
    "inventory-corpus",
    "audit-publication",
    "audit-national",
    "prepare-directory",
    "plan-publish",
    "publish",
  ].includes(command)
  const db = openStore(home, { write: mutating.has(command) && !fileOnly })
  try {
    const result = await execute(db)
    if (
      args.output &&
      ![
        "export",
        "backup",
        "migrate-corpus",
        "audit-publication",
        "audit-national",
        "prepare-directory",
        "plan-publish",
        "publish",
      ].includes(command)
    )
      privateWrite(args.output, result)
    console.log(JSON.stringify(result, null, 2))
  } finally {
    db.close()
  }
}
main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
