import type {
  PageHealthAffectedAccount,
  PageHealthEventListItem,
  PageHealthMonitorInput,
  PageHealthSeverity,
} from "../types"

type PageHealthMonitorPanelProps = {
  input: PageHealthMonitorInput
}

const NUMBER_FORMAT = new Intl.NumberFormat("en-US")

const SEVERITY_CLASS: Record<PageHealthSeverity, string> = {
  critical: "border-red-600 text-red-700 dark:text-red-300",
  info: "border-sky-600 text-sky-700 dark:text-sky-300",
  warning: "border-amber-500 text-amber-700 dark:text-amber-300",
}

function formatCount(value: number) {
  return NUMBER_FORMAT.format(value)
}

function formatDateTime(value: string | null) {
  if (!value) return "No data"
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value))
}

function formatDuration(value: number | null) {
  if (value == null) return "n/a"
  if (value >= 1000) return `${(value / 1000).toFixed(1)}s`
  return `${formatCount(value)}ms`
}

function MetricPanel({
  detail,
  label,
  value,
}: {
  detail: string
  label: string
  value: string
}) {
  return (
    <div className="bg-card rounded-lg border p-4">
      <p className="text-muted-foreground text-xs font-medium uppercase">
        {label}
      </p>
      <p className="text-foreground mt-3 text-3xl font-semibold tabular-nums">
        {value}
      </p>
      <p className="text-muted-foreground mt-1 truncate text-sm">{detail}</p>
    </div>
  )
}

function SeverityBadge({ severity }: { severity: PageHealthSeverity }) {
  return (
    <span
      className={`rounded-md border px-2 py-1 text-xs font-medium ${SEVERITY_CLASS[severity]}`}
    >
      {severity}
    </span>
  )
}

function AffectedAccountRow({
  account,
}: {
  account: PageHealthAffectedAccount
}) {
  return (
    <article className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_8rem_8rem_10rem]">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{account.userLabel}</p>
        <p className="text-muted-foreground mt-1 truncate text-xs">
          {account.orgLabel}
        </p>
      </div>
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">Events</p>
        <p className="font-semibold tabular-nums">
          {formatCount(account.eventCount)}
        </p>
      </div>
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">Critical</p>
        <p className="font-semibold tabular-nums">
          {formatCount(account.criticalCount)}
        </p>
      </div>
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">Latest</p>
        <p className="truncate text-sm font-medium">
          {formatDateTime(account.latestEventAt)}
        </p>
      </div>
      {account.latestRoute ? (
        <p className="text-muted-foreground truncate text-xs md:col-span-4">
          {account.latestRoute}
        </p>
      ) : null}
    </article>
  )
}

function AffectedAccounts({ input }: { input: PageHealthMonitorInput }) {
  return (
    <section
      aria-labelledby="page-health-affected"
      className="bg-card rounded-lg border"
    >
      <div className="border-b p-4">
        <h2 id="page-health-affected" className="text-base font-semibold">
          Affected accounts
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Users and organizations with page errors or slow loads in this window.
        </p>
      </div>
      <div className="divide-y">
        {input.affectedAccounts.length > 0 ? (
          input.affectedAccounts.map((account) => (
            <AffectedAccountRow account={account} key={account.id} />
          ))
        ) : (
          <div className="text-muted-foreground p-4 text-sm">
            No page-health events in this window.
          </div>
        )}
      </div>
    </section>
  )
}

function EventRow({ event }: { event: PageHealthEventListItem }) {
  return (
    <article className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_7rem_9rem]">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-sm font-semibold">{event.eventLabel}</p>
          <SeverityBadge severity={event.severity} />
        </div>
        <p className="text-muted-foreground mt-1 truncate text-xs">
          {event.routePath ?? "Unknown route"}
          {event.errorMessage ? ` - ${event.errorMessage}` : ""}
        </p>
      </div>
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">Load</p>
        <p className="font-semibold tabular-nums">
          {formatDuration(event.durationMs)}
        </p>
      </div>
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">Occurred</p>
        <p className="truncate text-sm font-medium">
          {formatDateTime(event.occurredAt)}
        </p>
      </div>
      <dl className="text-muted-foreground grid gap-3 text-xs sm:grid-cols-3 md:col-span-3">
        <div className="min-w-0">
          <dt>User</dt>
          <dd className="text-foreground truncate font-medium">
            {event.userLabel}
          </dd>
        </div>
        <div className="min-w-0">
          <dt>Org</dt>
          <dd className="text-foreground truncate font-medium">
            {event.orgLabel}
          </dd>
        </div>
        <div className="min-w-0">
          <dt>Source</dt>
          <dd className="text-foreground truncate font-medium">
            {event.source}
          </dd>
        </div>
      </dl>
    </article>
  )
}

function RecentEvents({ input }: { input: PageHealthMonitorInput }) {
  return (
    <section
      aria-labelledby="page-health-events"
      className="bg-card rounded-lg border"
    >
      <div className="border-b p-4">
        <h2 id="page-health-events" className="text-base font-semibold">
          Recent page events
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Errors, unhandled rejections, and slow page loads captured by the app.
        </p>
      </div>
      <div className="divide-y">
        {input.events.length > 0 ? (
          input.events
            .slice(0, 50)
            .map((event) => <EventRow event={event} key={event.id} />)
        ) : (
          <div className="text-muted-foreground p-4 text-sm">
            No recent page events.
          </div>
        )}
      </div>
    </section>
  )
}

export function PageHealthMonitorPanel({ input }: PageHealthMonitorPanelProps) {
  const summary = input.summary

  return (
    <div className="bg-background flex h-full min-h-0 flex-col overflow-hidden">
      <header className="bg-background shrink-0 border-b px-4 py-4 md:px-6">
        <div className="flex min-w-0 flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-balance">
              Page health monitor
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Last {input.windowDays} days, generated{" "}
              {formatDateTime(input.generatedAt)}.
            </p>
          </div>
          <span className="text-muted-foreground w-fit rounded-md border px-2 py-1 text-xs font-medium">
            {input.status === "ready" ? "Live" : "Unavailable"}
          </span>
        </div>
        {input.statusMessage ? (
          <p className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
            {input.statusMessage}
          </p>
        ) : null}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricPanel
            detail={`${formatCount(summary.affectedUsers)} users affected`}
            label="Events"
            value={formatCount(summary.totalEvents)}
          />
          <MetricPanel
            detail={`${formatCount(summary.warningEvents)} warnings`}
            label="Critical"
            value={formatCount(summary.criticalEvents)}
          />
          <MetricPanel
            detail="Slow or stuck page loads"
            label="Slow loads"
            value={formatCount(summary.slowEvents)}
          />
          <MetricPanel
            detail={`Latest ${formatDateTime(summary.latestEventAt)}`}
            label="Organizations"
            value={formatCount(summary.affectedOrgs)}
          />
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(18rem,0.85fr)_minmax(0,1.15fr)]">
          <AffectedAccounts input={input} />
          <RecentEvents input={input} />
        </div>
      </div>
    </div>
  )
}
