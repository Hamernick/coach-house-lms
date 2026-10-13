import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"

// Reparse once per retained source, not once per field or organization.
export function auditFilings(db, inventory) {
  const imported = db
    .prepare(
      `SELECT DISTINCT e.ein,s.id FROM events e JOIN sources s
    ON s.id=json_extract(e.body,'$.sourceId') WHERE e.kind='filing_imported' AND s.kind='irs990'`
    )
    .all()
  const sources = [...new Set(imported.map((r) => r.id))]
    .map((id) => inventory.byId.get(id))
    .filter((s) => s?.completed && s.integrity === "matched")
  const associations = new Set(imported.map((r) => `${r.ein}:${r.id}`))
  const byEin = new Map(),
    results = []
  for (let offset = 0; offset < sources.length; offset += 100) {
    const batch = sources.slice(offset, offset + 100)
    const output = execFileSync(
      "python3",
      [fileURLToPath(new URL("./parse-filings.py", import.meta.url))],
      {
        input:
          batch.map((s) => JSON.stringify(s.resolvedPath)).join("\n") + "\n",
        encoding: "utf8",
        timeout: 60000,
        maxBuffer: 16_000_000,
      }
    )
      .trim()
      .split("\n")
      .filter(Boolean)
      .map(JSON.parse)
    if (output.length !== batch.length)
      throw new Error("Filing parser output did not reconcile")
    for (let i = 0; i < batch.length; i++) {
      const s = batch[i],
        f = output[i]
      const valid =
        !f.error &&
        f.source_sha256 === s.sha256 &&
        associations.has(`${f.ein}:${s.id}`) &&
        /^https:\/\/apps\.irs\.gov\/pub\/epostcard\/990\/xml\//.test(
          f.source_url
        )
      results.push({
        sourceId: s.id,
        ein: f.ein ?? null,
        valid,
        reason: valid
          ? "exact_ein_xml_and_source_hash"
          : "filing_provenance_or_parse_failure",
      })
      if (valid) {
        const list = byEin.get(f.ein) ?? []
        list.push({ ...f, sourceId: s.id })
        byEin.set(f.ein, list)
      }
    }
  }
  return { byEin, results }
}
