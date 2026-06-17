import type { ActivationMonitorInput } from "../types"

type ActivationMonitorPanelProps = {
  input: ActivationMonitorInput
}

const NUMBER_FORMAT = new Intl.NumberFormat("en-US")

const SEVERITY_CLASS: Record<string, string> = {
  critical: "border-red-600 text-red-700 dark:text-red-300",
  warning: "border-amber-500 text-amber-700 dark:text-amber-300",
  info: "border-sky-600 text-sky-700 dark:text-sky-300",
}

function formatCount(value: number) {
  return NUMBER_FORMAT.format(value)
}

function formatDateTime(value: string | null) {
  if (!value) return "No data"
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))
}

function shortId(value: string | null) {
  if (!value) return "unknown"
  if (value.length <= 10) return value
  return `${value.slice(0, 4)}…${value.slice(-4)}`
}

function MetricPanel({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tabular-nums text-foreground">
        {value}
      </p>
      <p className="mt-1 truncate text-sm text-muted-foreground">{detail}</p>
    </div>
  )
}

function ActivationFunnel({ input }: { input: ActivationMonitorInput }) {
  const maxCount = Math.max(...input.funnelStages.map((stage) => stage.count), 1)

  return (
    <section
      aria-labelledby="activation-monitor-funnel"
      className="rounded-lg border bg-card"
    >
      <div className="border-b p-4">
        <h2 id="activation-monitor-funnel" className="text-base font-semibold">
          Activation funnel
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Durable checkpoints captured in the last {input.windowDays} days.
        </p>
      </div>
      <div className="divide-y">
        {input.funnelStages.map((stage) => {
          const width = Math.max((stage.count / maxCount) * 100, stage.count > 0 ? 6 : 0)
          return (
            <div
              key={stage.id}
              className="grid gap-3 p-4 md:grid-cols-[minmax(13rem,0.9fr)_minmax(16rem,1.4fr)_8rem]"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{stage.label}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {stage.description}
                </p>
              </div>
              <div className="flex min-w-0 items-center">
                <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-foreground"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
              <div className="text-left md:text-right">
                <p className="text-lg font-semibold tabular-nums">
                  {formatCount(stage.count)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stage.conversionFromPrevious == null
                    ? "entry"
                    : `${stage.conversionFromPrevious}% from prior`}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function AttentionQueue({ input }: { input: ActivationMonitorInput }) {
  return (
    <section
      aria-labelledby="activation-monitor-attention"
      className="rounded-lg border bg-card"
    >
      <div className="border-b p-4">
        <h2 id="activation-monitor-attention" className="text-base font-semibold">
          Attention queue
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Accounts with a captured step but no next checkpoint yet.
        </p>
      </div>
      <div className="divide-y">
        {input.attentionItems.length > 0 ? (
          input.attentionItems.map((item) => (
            <article key={item.id} className="grid gap-3 p-4">
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {item.summary}
                  </p>
                </div>
                <span
                  className={`rounded-md border px-2 py-1 text-xs font-medium ${SEVERITY_CLASS[item.severity]}`}
                >
                  {item.severity}
                </span>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                <div className="min-w-0">
                  <dt className="text-muted-foreground">User</dt>
                  <dd className="truncate font-medium tabular-nums">{shortId(item.userId)}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-muted-foreground">Org</dt>
                  <dd className="truncate font-medium tabular-nums">{shortId(item.orgId)}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-muted-foreground">Missing</dt>
                  <dd className="truncate font-medium">{item.missingCheckpoint}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-muted-foreground">Last seen</dt>
                  <dd className="truncate font-medium">{formatDateTime(item.lastSeenAt)}</dd>
                </div>
              </dl>
            </article>
          ))
        ) : (
          <div className="p-4 text-sm text-muted-foreground">
            No stuck activation paths in this window.
          </div>
        )}
      </div>
    </section>
  )
}

function CoveragePanel({ input }: { input: ActivationMonitorInput }) {
  return (
    <section
      aria-labelledby="activation-monitor-coverage"
      className="rounded-lg border bg-card"
    >
      <div className="border-b p-4">
        <h2 id="activation-monitor-coverage" className="text-base font-semibold">
          Telemetry coverage
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Expected product events and their matching checkpoints.
        </p>
      </div>
      <div className="divide-y">
        {input.coverageItems.map((item) => (
          <div
            key={item.id}
            className="grid gap-2 p-4 sm:grid-cols-[minmax(0,1fr)_6rem_6rem]"
          >
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={
                    item.status === "capturing"
                      ? "size-2 rounded-full bg-emerald-600"
                      : "size-2 rounded-full bg-muted-foreground"
                  }
                  aria-hidden="true"
                />
                <p className="truncate text-sm font-medium">{item.label}</p>
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {item.eventName}
                {item.checkpoint ? ` -> ${item.checkpoint}` : ""}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Events</p>
              <p className="font-semibold tabular-nums">{formatCount(item.eventCount)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Checkpoints</p>
              <p className="font-semibold tabular-nums">
                {formatCount(item.checkpointCount)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function EventStream({ input }: { input: ActivationMonitorInput }) {
  return (
    <section
      aria-labelledby="activation-monitor-events"
      className="rounded-lg border bg-card"
    >
      <div className="border-b p-4">
        <h2 id="activation-monitor-events" className="text-base font-semibold">
          Latest events
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Most recent server-side journey events in this window.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Event</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Surface</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {input.events.length > 0 ? (
              input.events.map((event) => (
                <tr key={event.id}>
                  <td className="max-w-[16rem] px-4 py-3">
                    <p className="truncate font-medium">{event.eventLabel}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {event.journey ?? event.source}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {event.planTier ?? "n/a"}
                  </td>
                  <td className="max-w-[12rem] px-4 py-3">
                    <p className="truncate">{event.surface ?? "server"}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {event.source}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-medium tabular-nums">
                    {shortId(event.userId)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(event.occurredAt)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={5}>
                  No telemetry events captured in this window.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function ActivationMonitorPanel({ input }: ActivationMonitorPanelProps) {
  return (
    <div className="h-full min-h-0 overflow-auto bg-background">
      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-5 p-4 md:p-6">
        <header className="flex flex-col gap-3 border-b pb-5 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              User journeys
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-normal">
              Activation monitor
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Paid onboarding and workspace checkpoints captured from durable
              server events.
            </p>
          </div>
          <div className="rounded-lg border bg-card px-3 py-2 text-sm">
            <p className="font-medium">
              {input.status === "ready" ? "Telemetry ready" : "Telemetry unavailable"}
            </p>
            <p className="text-xs text-muted-foreground">
              Updated {formatDateTime(input.generatedAt)}
            </p>
          </div>
        </header>

        {input.statusMessage ? (
          <div className="rounded-lg border border-amber-500 bg-card p-4 text-sm text-amber-700 dark:text-amber-300">
            {input.statusMessage}
          </div>
        ) : null}

        <section
          aria-label="Activation summary"
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          <MetricPanel
            label="Events"
            value={formatCount(input.summary.totalEvents)}
            detail={`Last ${input.windowDays} days`}
          />
          <MetricPanel
            label="Checkpoints"
            value={formatCount(input.summary.totalCheckpoints)}
            detail={`Latest ${formatDateTime(input.summary.latestCheckpointAt)}`}
          />
          <MetricPanel
            label="Users"
            value={formatCount(input.summary.uniqueUsers)}
            detail={`${formatCount(input.summary.uniqueOrgs)} organizations`}
          />
          <MetricPanel
            label="Needs review"
            value={formatCount(input.summary.attentionCount)}
            detail={`Latest event ${formatDateTime(input.summary.latestEventAt)}`}
          />
        </section>

        <ActivationFunnel input={input} />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <AttentionQueue input={input} />
          <CoveragePanel input={input} />
        </div>

        <EventStream input={input} />
      </div>
    </div>
  )
}
