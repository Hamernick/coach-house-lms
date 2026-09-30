import { Button } from "@/components/ui/button"
import type { CoachingCreditPanelData } from "../credit-types"
function dateLabel(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}
export function CoachingCreditHistory({
  data,
  pending,
  onLoadMore,
}: {
  data: CoachingCreditPanelData
  pending: boolean
  onLoadMore: () => void
}) {
  return (
    <div className="space-y-3 border-t pt-3">
      {data.account?.grants.map((grant) => (
        <div key={grant.id} className="text-xs">
          <span className="font-medium">{grant.label}</span> · {grant.issued}{" "}
          issued ·{" "}
          {grant.expiresAt && Date.parse(grant.expiresAt) <= Date.now()
            ? "Expired"
            : `${grant.available} available`}
          {grant.expiresAt ? (
            <span className="text-muted-foreground">
              {" "}
              · Expires {dateLabel(grant.expiresAt)}
            </span>
          ) : null}
        </div>
      ))}
      <ol
        className="max-h-72 space-y-3 overflow-y-auto"
        aria-label="Credit history"
      >
        {data.history.map((entry) => (
          <li key={entry.id} className="text-xs">
            <div className="flex justify-between gap-2">
              <span className="font-medium capitalize">
                {(
                  {
                    included: "Issued",
                    purchase: "Purchased",
                    adjustment: "Issued",
                    booking: "Reserved",
                    cancellation: "Restored",
                    late_cancellation: "Late cancellation",
                    canceled: "Canceled",
                    reschedule: "Rescheduled",
                    completed: "Completed",
                    no_show: "No-show",
                  } as Record<string, string>
                )[entry.source] ?? entry.source}
              </span>
              <span className="tabular-nums">
                {entry.quantity > 0 ? "+" : ""}
                {entry.quantity || "—"}
              </span>
            </div>
            <p className="text-muted-foreground">{entry.note}</p>
            <p className="text-muted-foreground">
              {entry.actorName}
              {entry.grant_id
                ? ` · ${data.account?.grants.find((grant) => grant.id === entry.grant_id)?.label ?? "Credit grant"}`
                : ""}
            </p>
            <time className="text-muted-foreground" dateTime={entry.created_at}>
              {dateLabel(entry.created_at)}
            </time>
            {entry.booking_id ? (
              <p className="text-muted-foreground break-all">
                Booking {entry.booking_id}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
      {!data.history.length ? (
        <p className="text-muted-foreground text-xs">No credit history yet.</p>
      ) : null}
      {data.hasMore ? (
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={onLoadMore}
        >
          Load older history
        </Button>
      ) : null}
    </div>
  )
}
