import { randomUUID } from "node:crypto"
import {
  event,
  hash,
  stable,
  transaction,
  utc,
  FIELDS,
  POLICY,
} from "./store.mjs"

export function claim(
  db,
  { worker, limit = 1, leaseSeconds = 900, now = Date.now(), ein = null }
) {
  if (!/^[a-zA-Z0-9_.-]{1,80}$/.test(worker ?? ""))
    throw new Error(
      "Provide a unique --worker (letters, numbers, dot, dash, underscore)"
    )
  if (!Number.isInteger(limit) || limit < 1 || limit > 25)
    throw new Error("Claim limit must be 1..25")
  if (
    !Number.isInteger(leaseSeconds) ||
    leaseSeconds < 60 ||
    leaseSeconds > 3600
  )
    throw new Error("Lease must be 60..3600 seconds")
  return transaction(db, () => {
    const expired = db
      .prepare(
        "SELECT ein,token FROM jobs WHERE status='running' AND expires_at<=?"
      )
      .all(now)
    for (const row of expired)
      event(db, row.ein, "lease_expired", { token: row.token })
    db.prepare(
      "UPDATE jobs SET status=CASE WHEN attempts>=3 THEN 'exhausted' ELSE 'retry' END, token=NULL, worker=NULL, reason='lease_expired', updated_at=? WHERE status='running' AND expires_at<=?"
    ).run(utc(), now)
    // A nullable OR makes SQLite scan the national queue even for one EIN.
    // Keep exact claims on the primary key without changing eligibility gates.
    const rows = db
      .prepare(
        `SELECT j.ein,o.identity FROM jobs j JOIN organizations o USING(ein) JOIN sources s ON s.id=o.source_id
      WHERE j.status IN ('pending','retry') AND j.attempts<3 AND j.next_at<=? AND s.completed=1 ${ein === null ? "" : "AND j.ein=?"} ORDER BY j.ein LIMIT ?`
      )
      .all(...(ein === null ? [now, limit] : [now, ein, limit]))
    return rows.map((row) => {
      const token = randomUUID(),
        expiresAt = now + leaseSeconds * 1000
      db.prepare(
        "UPDATE jobs SET status='running',attempts=attempts+1,worker=?,token=?,expires_at=?,updated_at=? WHERE ein=?"
      ).run(worker, token, expiresAt, utc(), row.ein)
      event(db, row.ein, "claimed", { worker, token, expiresAt })
      return {
        ein: row.ein,
        token,
        worker,
        expiresAt,
        identity: JSON.parse(row.identity),
        evidence: evidenceFor(db, row.ein),
        missingFields: missingFields(db, row.ein),
        publicationBlocked: true,
      }
    })
  })
}

export function assertLease(db, ein, token, now = Date.now()) {
  const job = db.prepare("SELECT * FROM jobs WHERE ein=?").get(ein)
  if (
    !job ||
    job.status !== "running" ||
    job.token !== token ||
    job.expires_at <= now
  )
    throw new Error(
      "Lease expired or owned by another worker; reclaim before writing"
    )
  return job
}

export function heartbeat(db, ein, token) {
  return transaction(db, () => {
    assertLease(db, ein, token)
    const expiresAt = Date.now() + 900_000
    db.prepare("UPDATE jobs SET expires_at=?,updated_at=? WHERE ein=?").run(
      expiresAt,
      utc(),
      ein
    )
    event(db, ein, "heartbeat", { token, expiresAt })
    return { ein, expiresAt }
  })
}

export function fail(db, ein, token, reason, retryable = true) {
  if (typeof reason !== "string" || reason.length < 1 || reason.length > 500)
    throw new Error("A bounded failure reason is required")
  return transaction(db, () => {
    const job = assertLease(db, ein, token)
    const status = retryable && job.attempts < 3 ? "retry" : "exhausted"
    db.prepare(
      "UPDATE jobs SET status=?,reason=?,next_at=?,token=NULL,worker=NULL,expires_at=NULL,updated_at=? WHERE ein=?"
    ).run(
      status,
      reason,
      Date.now() + Math.min(3600, 60 * 2 ** job.attempts) * 1000,
      utc(),
      ein
    )
    event(db, ein, "failed", { token, reason, status })
    return { ein, status }
  })
}

export function evidenceFor(db, ein) {
  return db
    .prepare(
      "SELECT field,value,state,source_url,observed_at,body FROM evidence WHERE ein=? ORDER BY field,observed_at,id"
    )
    .all(ein)
    .map((r) => ({
      ...r,
      value: JSON.parse(r.value),
      body: JSON.parse(r.body),
    }))
}
export function missingFields(db, ein) {
  const verified = new Set(
    db
      .prepare(
        "SELECT DISTINCT field FROM evidence WHERE ein=? AND state='verified' AND observed_at>=?"
      )
      .all(ein, new Date(Date.now() - 30 * 86400_000).toISOString())
      .map((r) => r.field)
  )
  return FIELDS.filter((f) => !verified.has(f))
}

export function addEvidence(
  db,
  ein,
  assertion,
  { trustedState = "candidate" } = {}
) {
  if (!FIELDS.includes(assertion.field))
    throw new Error(`Unsupported field: ${assertion.field}`)
  if (assertion.value == null || stable(assertion.value).length > 16000)
    throw new Error("Missing or oversized value")
  let url
  try {
    url = new URL(assertion.source_url)
  } catch {
    throw new Error("Evidence requires source_url")
  }
  if (
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password
  )
    throw new Error("Evidence source must be a public HTTP(S) URL")
  if (
    !Number.isFinite(Date.parse(assertion.observed_at)) ||
    Date.parse(assertion.observed_at) > Date.now() + 300_000
  )
    throw new Error("Evidence requires a valid non-future observed_at")
  if (
    typeof assertion.evidence !== "string" ||
    !assertion.evidence.trim() ||
    assertion.evidence.length > 20000
  )
    throw new Error("Evidence text required (max 20000 characters)")
  // External agents cannot elevate trust by submitting state/confidence/reviewer fields.
  const body = {
    field: assertion.field,
    value: assertion.value,
    source_url: url.href,
    observed_at: assertion.observed_at,
    evidence: assertion.evidence,
    content_sha256: hash(assertion.evidence),
    method: assertion.method ?? "agent_proposal",
    source_type: assertion.source_type ?? "unverified_source",
    license: assertion.license ?? "unknown",
    policy: POLICY,
  }
  const id = hash({ ein, ...body })
  db.prepare("INSERT OR IGNORE INTO evidence VALUES (?,?,?,?,?,?,?,?,?)").run(
    id,
    ein,
    body.field,
    stable(body.value),
    trustedState,
    body.source_url,
    body.observed_at,
    stable(body),
    POLICY
  )
  return id
}

export function complete(db, submission) {
  if (
    !submission ||
    typeof submission.id !== "string" ||
    !/^[\w.-]{1,120}$/.test(submission.id)
  )
    throw new Error("Submission id required")
  if (
    !Array.isArray(submission.assertions) ||
    submission.assertions.length > 100
  )
    throw new Error("assertions must be an array of at most 100")
  if (
    !Array.isArray(submission.unresolved) ||
    submission.unresolved.length > FIELDS.length
  )
    throw new Error("unresolved must be a bounded array")
  const digest = hash(submission)
  return transaction(db, () => {
    const previous = db
      .prepare("SELECT * FROM submissions WHERE id=?")
      .get(submission.id)
    if (previous) {
      if (previous.digest !== digest)
        throw new Error("Submission id reused with different content")
      return { ein: previous.ein, replayed: true }
    }
    assertLease(db, submission.ein, submission.token)
    for (const a of submission.assertions) addEvidence(db, submission.ein, a)
    for (const u of submission.unresolved) {
      if (
        !FIELDS.includes(u.field) ||
        typeof u.reason !== "string" ||
        !u.reason.trim() ||
        u.reason.includes("REPLACE_WITH") ||
        u.reason.length > 500
      )
        throw new Error("Invalid unresolved field/reason")
      db.prepare(
        "INSERT INTO unresolved VALUES (?,?,?,?) ON CONFLICT(ein,field) DO UPDATE SET reason=excluded.reason,observed_at=excluded.observed_at"
      ).run(submission.ein, u.field, u.reason, utc())
    }
    const accounted = new Set([
      ...submission.assertions.map((a) => a.field),
      ...submission.unresolved.map((u) => u.field),
    ])
    for (const field of missingFields(db, submission.ein))
      if (!accounted.has(field))
        throw new Error(`Account for missing field: ${field}`)
    db.prepare("INSERT INTO submissions VALUES (?,?,?,?,?)").run(
      submission.id,
      submission.ein,
      submission.token,
      digest,
      utc()
    )
    db.prepare(
      "UPDATE jobs SET status='partially_succeeded',token=NULL,worker=NULL,expires_at=NULL,reason='evidence_retained_publication_blocked',updated_at=? WHERE ein=?"
    ).run(utc(), submission.ein)
    event(db, submission.ein, "completed", {
      submission: submission.id,
      digest,
      assertions: submission.assertions.length,
      unresolved: submission.unresolved.length,
    })
    return { ein: submission.ein, replayed: false, publicationBlocked: true }
  })
}
