import {
  createReadStream,
  readFileSync,
  mkdirSync,
  openSync,
  writeSync,
  fsyncSync,
  closeSync,
} from "node:fs"
import { createInterface } from "node:readline"
import { join, resolve } from "node:path"
import { fileHash } from "./import.mjs"
import { privateWrite } from "./artifacts.mjs"
import { stable, hash, utc } from "./store.mjs"
import { AUDIT_POLICY } from "./publication-policy.mjs"

export async function* readPrivateRows(path) {
  for await (const line of createInterface({
    input: createReadStream(path, { encoding: "utf8" }),
    crlfDelay: Infinity,
  })) {
    if (Buffer.byteLength(line) > 1_000_000)
      throw new Error("Private row exceeds byte limit")
    if (line.trim()) yield JSON.parse(line)
  }
}

export function directoryRecord(decision) {
  if (decision.policy !== AUDIT_POLICY || !decision.directory?.eligible)
    return null
  const eligible = (field) =>
    decision.fields[field]?.eligible ? decision.fields[field] : null
  const website = eligible("website"),
    phone = eligible("phone"),
    description = eligible("description")
  const address = eligible("filing_address") ? decision.location?.address : null
  // Never export raw evidence, exact filing street, claims, logos or inferred services.
  return {
    ein: decision.ein,
    name: decision.directory.name,
    city: address?.city || null,
    state: address?.state || null,
    postalCode: address?.postalCode || null,
    website: website?.value ?? null,
    phone: phone?.value ?? null,
    description: description?.value ?? null,
    websiteBasis: website?.basis ?? null,
    websiteSourcePeriod: website?.sourcePeriod ?? null,
    phoneBasis: phone?.basis ?? null,
    phoneSourcePeriod: phone?.sourcePeriod ?? null,
    descriptionSourcePeriod: description?.sourcePeriod ?? null,
  }
}

export async function prepareDirectory(auditDirectory, output) {
  const input = resolve(auditDirectory),
    target = resolve(output)
  const report = JSON.parse(readFileSync(join(input, "report.json"), "utf8"))
  if (report.policy !== AUDIT_POLICY || !report.completedAt)
    throw new Error("Unsupported or incomplete audit")
  const auditFile = join(input, "eligibility.jsonl")
  if ((await fileHash(auditFile)) !== report.outputHashes["eligibility.jsonl"])
    throw new Error("Audit artifact hash mismatch")
  mkdirSync(target, { mode: 0o700 })
  const fd = openSync(join(target, "records.jsonl"), "wx", 0o600)
  let scanned = 0,
    records = 0,
    after = ""
  try {
    for await (const decision of readPrivateRows(auditFile)) {
      if (!/^\d{9}$/.test(decision.ein) || decision.ein <= after)
        throw new Error("Audit EIN order/uniqueness invalid")
      after = decision.ein
      scanned++
      const record = directoryRecord(decision)
      if (!record) continue
      const recordText = stable(record)
      writeSync(
        fd,
        stable({
          ein: record.ein,
          recordText,
          recordDigest: hash(recordText),
        }) + "\n"
      )
      records++
    }
    fsyncSync(fd)
  } finally {
    closeSync(fd)
  }
  if (
    scanned !== report.organizations ||
    records !== report.directoryEligible ||
    (await fileHash(auditFile)) !== report.outputHashes["eligibility.jsonl"]
  )
    throw new Error("Audit population or source changed")
  const manifest = {
    kind: "nonprofit_directory_projection_v1",
    policy: AUDIT_POLICY,
    createdAt: utc(),
    auditDirectory: input,
    auditReportHash: await fileHash(join(input, "report.json")),
    auditAsOf: report.asOf,
    ledgerInputDigest: report.ledgerInputDigest,
    scanned,
    records,
    recordsHash: await fileHash(join(target, "records.jsonl")),
    publicWrites: 0,
  }
  privateWrite(join(target, "projection.json"), manifest)
  return { ...manifest, directory: target }
}
