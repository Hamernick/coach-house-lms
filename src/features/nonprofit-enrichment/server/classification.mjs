import { classifyResourceTaxonomy } from "../../../../scripts/resource-map/lib/data-engine/taxonomy-classifier.mjs"
import { addEvidence } from "./queue.mjs"
import { transaction, event } from "./store.mjs"

export function classifyEvidence(db, ein) {
  if (!db.prepare("SELECT ein FROM organizations WHERE ein=?").get(ein))
    throw new Error("Unknown EIN")
  const inputs = db
    .prepare(
      "SELECT * FROM evidence WHERE ein=? AND field IN ('description','services') AND state IN ('candidate','verified') ORDER BY id"
    )
    .all(ein)
  let candidates = 0,
    abstentions = 0
  transaction(db, () => {
    for (const row of inputs) {
      const body = JSON.parse(row.body)
      const result = classifyResourceTaxonomy({
        extractedFields: { description: body.evidence },
      })
      if (
        !result.matchedTerms.length ||
        result.flags.includes("fallback_community")
      ) {
        abstentions++
        continue
      }
      addEvidence(db, ein, {
        field: "categories",
        value: result.resourceCategories,
        source_url: row.source_url,
        observed_at: row.observed_at,
        evidence: body.evidence,
        method: `${result.taxonomyVersion}:candidate:${row.id}`,
        source_type: body.source_type,
        license: body.license,
      })
      candidates++
    }
    event(db, ein, "classification_candidates", { candidates, abstentions })
  })
  return { ein, candidates, abstentions, publicationBlocked: true }
}
