import { Skeleton } from "@/components/ui/skeleton"

import type {
  WorkspaceFinanceDataState,
  WorkspaceFinanceRaisingProgram,
  WorkspaceFinanceSource,
  WorkspaceFinanceSourceKind,
} from "../types"
import { WorkspaceFinanceProgramTargetsPopover } from "./workspace-finance-program-targets-popover"

const sourceColors: Record<WorkspaceFinanceSourceKind, string> = {
  donations: "var(--chart-1)",
  grants: "var(--chart-2)",
  earned_revenue: "var(--chart-3)",
  other: "var(--chart-4)",
}

function formatCurrency(amountCents: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(amountCents / 100)
}

export function WorkspaceFinanceRaisedSummary({
  raisedCents,
  raisingPrograms,
  sources,
  state,
  targetCents,
}: {
  raisedCents: number
  raisingPrograms: WorkspaceFinanceRaisingProgram[]
  sources: WorkspaceFinanceSource[]
  state: WorkspaceFinanceDataState
  targetCents: number | null
}) {
  const loading = state === "loading"
  const unavailable = state === "error"
  const sourceDescription = sources
    .map((source) => `${source.label} ${Math.round(source.percentage)} percent`)
    .join(", ")
  const railTotalCents = targetCents
    ? Math.max(targetCents, raisedCents)
    : raisedCents
  const remainingCents = targetCents
    ? Math.max(targetCents - raisedCents, 0)
    : null
  const attributedRaisedCents = raisingPrograms.reduce(
    (total, program) => total + program.raisedCents,
    0
  )
  const unassignedRaisedCents = Math.max(raisedCents - attributedRaisedCents, 0)
  const railDescription = targetCents
    ? `Raised ${formatCurrency(raisedCents)} of ${formatCurrency(targetCents)} target${sourceDescription ? `. Sources: ${sourceDescription}` : ""}`
    : sources.length
      ? `Raised funding sources: ${sourceDescription}`
      : "No raised funding sources yet"

  return (
    <section aria-labelledby="workspace-finance-raised-title">
      <h2
        id="workspace-finance-raised-title"
        className="text-muted-foreground text-xs font-medium"
      >
        Raised
      </h2>
      {loading ? (
        <Skeleton
          className="mt-2 h-8 w-28"
          aria-label="Loading raised amount"
        />
      ) : (
        <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
          {formatCurrency(unavailable ? 0 : raisedCents)}
        </p>
      )}
      <p className="text-muted-foreground mt-1 text-xs">
        {unavailable
          ? "Verified records could not be loaded"
          : raisedCents
            ? "Verified funding received"
            : "No verified funding yet"}
      </p>

      {loading ? (
        <Skeleton className="mt-4 h-2 w-full max-w-lg rounded-full" />
      ) : (
        <div
          role="img"
          aria-label={railDescription}
          className="bg-muted mt-4 flex h-2 w-full max-w-lg overflow-hidden rounded-full"
        >
          {sources.map((source) => (
            <span
              key={source.kind}
              aria-hidden="true"
              className="h-full first:rounded-l-full last:rounded-r-full"
              style={{
                backgroundColor: sourceColors[source.kind],
                width: `${railTotalCents ? (source.amountCents / railTotalCents) * 100 : 0}%`,
              }}
            />
          ))}
          {!sources.length && raisedCents > 0 ? (
            <span
              aria-hidden="true"
              className="bg-foreground/20 h-full rounded-full"
              style={{
                width: `${railTotalCents ? (raisedCents / railTotalCents) * 100 : 0}%`,
              }}
            />
          ) : null}
        </div>
      )}

      {targetCents ? (
        <div className="text-muted-foreground mt-2 flex max-w-lg flex-wrap items-center gap-x-1 text-xs">
          <span className="tabular-nums">
            Target {formatCurrency(targetCents)}
          </span>
          {!loading && !unavailable ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {remainingCents
                  ? `${formatCurrency(remainingCents)} remaining`
                  : "Complete"}
              </span>
            </>
          ) : null}
          <span aria-hidden="true">·</span>
          <WorkspaceFinanceProgramTargetsPopover
            programs={raisingPrograms}
            unassignedRaisedCents={unassignedRaisedCents}
          />
        </div>
      ) : null}

      {sources.length ? (
        <ul className="mt-3 flex max-w-lg flex-wrap gap-x-4 gap-y-2">
          {sources.map((source) => (
            <li
              key={source.kind}
              className="text-muted-foreground flex items-center gap-1.5 text-xs"
            >
              <span
                aria-hidden="true"
                className="size-2 rounded-full"
                style={{ backgroundColor: sourceColors[source.kind] }}
              />
              <span>{source.label}</span>
              <span className="text-foreground font-medium tabular-nums">
                {formatCurrency(source.amountCents)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
