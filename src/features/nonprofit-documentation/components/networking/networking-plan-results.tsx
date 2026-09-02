import CheckIcon from "lucide-react/dist/esm/icons/check"
import CopyIcon from "lucide-react/dist/esm/icons/copy"
import DownloadIcon from "lucide-react/dist/esm/icons/download"

import { Button } from "@/components/ui/button"

import {
  NETWORKING_CATEGORIES,
  NETWORKING_ENGAGEMENTS,
  buildNetworkingActions,
  buildNetworkingReviewPrompt,
  networkingCategoryLabel,
  networkingEngagementLabel,
  networkingObjectiveLabel,
  summarizeNetworkingPlan,
} from "../../lib/networking-plan"
import type {
  NetworkingPlanDraft,
  NetworkingRelationshipDraft,
} from "../../types"

function RelationshipPathway({
  relationships,
}: {
  relationships: NetworkingRelationshipDraft[]
}) {
  const mapped = relationships.filter(({ label }) => label.trim())
  return (
    <div className="bg-border grid gap-px overflow-hidden border lg:grid-cols-5">
      {NETWORKING_ENGAGEMENTS.map((engagement, index) => {
        const items = mapped.filter(
          (relationship) => relationship.engagement === engagement.id
        )
        return (
          <section
            key={engagement.id}
            className="bg-background min-w-0 p-4"
            aria-labelledby={`network-path-${engagement.id}`}
          >
            <p className="text-muted-foreground font-mono text-xs tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </p>
            <h4
              id={`network-path-${engagement.id}`}
              className="mt-2 text-sm font-semibold"
            >
              {engagement.label}
            </h4>
            <p className="text-muted-foreground mt-1 text-xs leading-5">
              {engagement.description}
            </p>
            <div className="mt-4 grid gap-2">
              {items.length > 0 ? (
                items.map((relationship) => (
                  <div key={relationship.id} className="bg-muted/35 border p-3">
                    <p className="text-xs font-semibold break-words">
                      {relationship.label}
                    </p>
                    <p className="text-muted-foreground mt-1 text-[11px] leading-4">
                      {networkingCategoryLabel(relationship.category)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground border border-dashed p-3 text-xs leading-5">
                  No labeled relationship in this mode.
                </p>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function RelationshipTable({
  relationships,
}: {
  relationships: NetworkingRelationshipDraft[]
}) {
  const mapped = relationships.filter(({ label }) => label.trim())
  return (
    <div className="mt-4 overflow-x-auto border">
      <table className="w-full min-w-[68rem] border-collapse text-left text-sm">
        <caption className="sr-only">
          Complete working relationship map with reciprocal value and follow-up
        </caption>
        <thead className="bg-muted/45">
          <tr>
            {[
              "Organization or role",
              "Category",
              "Mode",
              "Purpose",
              "Responsible offer",
              "Next step",
              "Owner and review",
            ].map((heading) => (
              <th key={heading} scope="col" className="px-4 py-3 font-semibold">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {mapped.length > 0 ? (
            mapped.map((relationship) => (
              <tr key={relationship.id} className="align-top">
                <th scope="row" className="px-4 py-4 font-semibold">
                  {relationship.label}
                </th>
                <td className="px-4 py-4">
                  {networkingCategoryLabel(relationship.category)}
                </td>
                <td className="px-4 py-4">
                  {networkingEngagementLabel(relationship.engagement)}
                </td>
                <td className="px-4 py-4 leading-6">
                  {relationship.purpose || "Not drafted"}
                </td>
                <td className="px-4 py-4 leading-6">
                  {relationship.responsibleOffer || "Not drafted"}
                </td>
                <td className="px-4 py-4 leading-6">
                  {relationship.nextStep || "Not drafted"}
                </td>
                <td className="px-4 py-4 leading-6">
                  <span className="block font-medium">
                    {relationship.owner || "No owner"}
                  </span>
                  <span className="text-muted-foreground mt-1 block text-xs">
                    {relationship.reviewTiming || "No review timing"}
                  </span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={7}
                className="text-muted-foreground px-4 py-8 text-center"
              >
                Add an organization or relationship-role label to build the map.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export function NetworkingPlanResults({
  draft,
  promptCopied,
  onCopyPrompt,
  onDownload,
}: {
  draft: NetworkingPlanDraft
  promptCopied: boolean
  onCopyPrompt: () => void
  onDownload: () => void
}) {
  const summary = summarizeNetworkingPlan(draft)
  const actions = buildNetworkingActions(draft)
  const prompt = buildNetworkingReviewPrompt(draft)

  return (
    <div className="bg-muted/20 border-t p-5 sm:p-6">
      <div className="bg-border grid gap-px overflow-hidden border sm:grid-cols-2 lg:grid-cols-6">
        {[
          ["Relationships", summary.relationshipCount],
          ["Categories", summary.representedCategoryCount],
          ["Engagement modes", summary.representedEngagementCount],
          ["Next steps", summary.nextStepCount],
          [
            "Drafted areas",
            `${summary.draftedAreaCount}/${summary.totalAreaCount}`,
          ],
          [
            "Safeguards",
            `${summary.safeguardCount}/${summary.totalSafeguardCount}`,
          ],
        ].map(([label, value]) => (
          <div key={label} className="bg-background p-4">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {label}
            </p>
            <p className="mt-3 text-lg font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>
      <p className="text-muted-foreground mt-3 text-xs leading-5">
        Counts describe this draft. They do not measure relationship quality,
        trust, reciprocity, access, influence, representation, power, equity,
        consent, readiness, or likely results.
      </p>

      <section className="mt-8" aria-labelledby="network-purpose-title">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          {networkingObjectiveLabel(draft.objective)} · {draft.reviewWeeks}-week
          review
        </p>
        <h3 id="network-purpose-title" className="mt-2 font-semibold">
          Relationship system purpose
        </h3>
        <div className="bg-foreground text-background mt-4 p-5 sm:p-6">
          <p className="text-lg leading-8 font-semibold">
            {draft.networkingPurpose ||
              "Define the mission purpose and decision this relationship system should improve."}
          </p>
          <div className="border-background/25 mt-5 border-t pt-4">
            <p className="text-background/70 text-xs font-semibold tracking-wide uppercase">
              Community accountability
            </p>
            <p className="mt-2 text-sm leading-6">
              {draft.communityAccountability ||
                "Describe how people affected by the work shape the map, decisions, interpretation, and follow-up."}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="network-pathway-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 id="network-pathway-title" className="font-semibold">
              Live relationship pathway
            </h3>
            <p className="text-muted-foreground mt-1 text-sm">
              A working mode, not a maturity ladder. Relationships can move in
              either direction or remain appropriately bounded.
            </p>
          </div>
          <span className="bg-background border px-3 py-1 text-xs font-medium">
            Device-local · Contacts no one
          </span>
        </div>
        <div className="mt-4">
          <RelationshipPathway relationships={draft.relationships} />
        </div>
      </section>

      <section className="mt-8" aria-labelledby="network-coverage-title">
        <h3 id="network-coverage-title" className="font-semibold">
          Category coverage
        </h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Coverage exposes assumptions and gaps; it does not set a quota or rank
          any role.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {NETWORKING_CATEGORIES.map((category) => {
            const count = draft.relationships.filter(
              (relationship) =>
                relationship.label.trim() &&
                relationship.category === category.id
            ).length
            return (
              <div key={category.id} className="bg-background border p-4">
                <p className="text-sm font-semibold">{category.label}</p>
                <p className="text-muted-foreground mt-2 text-xs leading-5">
                  {category.description}
                </p>
                <p className="mt-3 font-mono text-sm tabular-nums">
                  {count} mapped
                </p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="network-table-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 id="network-table-title" className="font-semibold">
              Complete relationship map
            </h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Scroll the table horizontally on a small screen.
            </p>
          </div>
          <Button type="button" className="min-h-11" onClick={onDownload}>
            <DownloadIcon className="size-4" aria-hidden />
            Download map CSV
          </Button>
        </div>
        <RelationshipTable relationships={draft.relationships} />
      </section>

      <section className="mt-8" aria-labelledby="network-actions-title">
        <h3 id="network-actions-title" className="font-semibold">
          Stage and missing-map actions
        </h3>
        <p className="text-muted-foreground mt-1 text-sm">
          {actions.length} actions generated from this draft. They are review
          prompts, not approval or relationship findings.
        </p>
        <ol className="mt-4 divide-y border-y">
          {actions.map((item, index) => (
            <li
              key={item.id}
              className="grid gap-3 py-5 sm:grid-cols-[2.5rem_minmax(0,1fr)]"
            >
              <span className="text-muted-foreground font-mono text-xs tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <span className="bg-muted border px-2 py-0.5 text-[11px] font-medium">
                  {item.phase}
                </span>
                <p className="mt-3 text-sm leading-6 font-semibold">
                  {item.action}
                </p>
                <p className="text-muted-foreground mt-2 text-sm leading-6">
                  <strong className="text-foreground">Keep:</strong>{" "}
                  {item.evidence}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-8 border" aria-labelledby="network-prompt-title">
        <div className="bg-muted/35 flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <div>
            <h3 id="network-prompt-title" className="text-sm font-semibold">
              Guarded human-review prompt
            </h3>
            <p className="text-muted-foreground mt-1 text-xs">
              Copy the brief and constraints. Review all output yourself.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={onCopyPrompt}
          >
            {promptCopied ? (
              <CheckIcon className="size-4" aria-hidden />
            ) : (
              <CopyIcon className="size-4" aria-hidden />
            )}
            {promptCopied ? "Copied" : "Copy review prompt"}
          </Button>
        </div>
        <pre className="max-h-72 overflow-auto p-4 font-mono text-xs leading-5 whitespace-pre-wrap">
          {prompt}
        </pre>
      </section>
    </div>
  )
}
