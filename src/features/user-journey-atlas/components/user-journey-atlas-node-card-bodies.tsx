"use client"

import ActivityIcon from "lucide-react/dist/esm/icons/activity"
import BadgeCheckIcon from "lucide-react/dist/esm/icons/badge-check"
import BotIcon from "lucide-react/dist/esm/icons/bot"
import MailIcon from "lucide-react/dist/esm/icons/mail"

import type { UserJourneyAtlasNode } from "../types"

type UserJourneyNodeBodyProps = {
  node: UserJourneyAtlasNode
  surfaceStyle: {
    accent: string
  }
}

function renderOverflowCount(total: number, shown: number) {
  const hidden = Math.max(0, total - shown)
  if (hidden === 0) return null

  return (
    <p className="mt-1 truncate text-[10px] leading-4 text-muted-foreground">
      + {hidden} more
    </p>
  )
}

function UserJourneyRouteCardBody({
  node,
  surfaceStyle,
}: UserJourneyNodeBodyProps) {
  const visibleFields = node.dataFields.slice(0, 2)

  return (
    <section
      className="mt-3 h-[7.25rem] shrink-0 overflow-hidden rounded-md bg-background ring-1 ring-border"
      data-user-journey-card-kind={node.surfaceKind}
    >
      <div className="border-b border-border px-2.5 py-1.5">
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-muted-foreground" />
          <span className="size-1.5 rounded-full bg-muted-foreground" />
          <span className="size-1.5 rounded-full bg-muted-foreground" />
          <span className="ml-1 min-w-0 flex-1 truncate rounded-sm bg-muted px-2 py-0.5 text-[10px] leading-4 text-muted-foreground">
            {node.route}
          </span>
        </div>
      </div>
      <div className="grid gap-1.5 px-2.5 py-2">
        <p className="text-[10px] font-semibold uppercase leading-4 text-muted-foreground">
          Screen state
        </p>
        {visibleFields.map((field) => (
          <p key={field} className="truncate text-[11px] leading-4 text-foreground">
            <span style={{ color: surfaceStyle.accent }}>•</span> {field}
          </p>
        ))}
        {renderOverflowCount(node.dataFields.length, visibleFields.length)}
      </div>
    </section>
  )
}

function UserJourneyFormCardBody({
  node,
  surfaceStyle,
}: UserJourneyNodeBodyProps) {
  const visibleFields = node.dataFields.slice(0, 3)

  return (
    <section
      className="mt-3 h-[7.25rem] shrink-0 overflow-hidden rounded-md bg-background px-2.5 py-2 ring-1 ring-border"
      data-user-journey-card-kind={node.surfaceKind}
    >
      <p className="text-[10px] font-semibold uppercase leading-4 text-muted-foreground">
        Fields
      </p>
      <div className="mt-1.5 grid gap-1">
        {visibleFields.map((field, index) => (
          <div
            key={field}
            className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-2 rounded-sm border border-border bg-background px-2 py-1"
          >
            <span
              className="text-[9px] font-semibold uppercase leading-4"
              style={{ color: surfaceStyle.accent }}
            >
              Field {index + 1}
            </span>
            <span className="truncate text-[11px] leading-4 text-foreground">
              {field}
            </span>
          </div>
        ))}
      </div>
      {renderOverflowCount(node.dataFields.length, visibleFields.length)}
    </section>
  )
}

function UserJourneyEmailCardBody({
  node,
  surfaceStyle,
}: UserJourneyNodeBodyProps) {
  const [to = "recipient", subject = "subject", link = "link"] = node.dataFields

  return (
    <section
      className="mt-3 h-[7.25rem] shrink-0 overflow-hidden rounded-md border border-dashed border-border bg-background px-2.5 py-2"
      data-user-journey-card-kind={node.surfaceKind}
    >
      <div className="flex items-center justify-between border-b border-border pb-1.5">
        <p className="text-[10px] font-semibold uppercase leading-4 text-muted-foreground">
          Email payload
        </p>
        <MailIcon
          aria-hidden="true"
          className="size-3.5"
          style={{ color: surfaceStyle.accent }}
        />
      </div>
      <dl className="mt-1.5 grid gap-1 text-[11px] leading-4">
        {[
          ["To", to],
          ["Subject", subject],
          ["CTA", link],
        ].map(([label, value]) => (
          <div key={label} className="grid grid-cols-[3rem_minmax(0,1fr)] gap-2">
            <dt className="font-semibold text-muted-foreground">{label}</dt>
            <dd className="truncate text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function UserJourneyPaymentCardBody({ node }: UserJourneyNodeBodyProps) {
  const visibleFields = node.dataFields.slice(0, 3)

  return (
    <section
      className="mt-3 h-[7.25rem] shrink-0 overflow-hidden rounded-md bg-background px-2.5 py-2 ring-1 ring-border"
      data-user-journey-card-kind={node.surfaceKind}
    >
      <div className="flex items-center justify-between border-b border-dashed border-border pb-1.5">
        <p className="text-[10px] font-semibold uppercase leading-4 text-muted-foreground">
          Billing handoff
        </p>
        <span className="text-[10px] font-semibold leading-4 text-emerald-700 dark:text-emerald-300">
          Stripe
        </span>
      </div>
      <dl className="mt-1.5 grid gap-1 text-[11px] leading-4">
        {visibleFields.map((field, index) => (
          <div key={field} className="flex min-w-0 items-center justify-between gap-2">
            <dt className="text-muted-foreground">Line {index + 1}</dt>
            <dd className="truncate text-right text-foreground">{field}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function UserJourneyDataCardBody({ node }: UserJourneyNodeBodyProps) {
  const visibleFields = node.dataFields.slice(0, 3)

  return (
    <section
      className="mt-3 h-[7.25rem] shrink-0 overflow-hidden rounded-md bg-background ring-1 ring-border"
      data-user-journey-card-kind={node.surfaceKind}
    >
      <div className="grid grid-cols-[5.25rem_minmax(0,1fr)] border-b border-border px-2.5 py-1.5 text-[10px] font-semibold uppercase leading-4 text-muted-foreground">
        <span>Write</span>
        <span>Value</span>
      </div>
      <div className="grid">
        {visibleFields.map((field) => (
          <div
            key={field}
            className="grid grid-cols-[5.25rem_minmax(0,1fr)] border-b border-border px-2.5 py-1.5 text-[11px] leading-4 last:border-b-0"
          >
            <span className="text-muted-foreground">column</span>
            <span className="truncate text-foreground">{field}</span>
          </div>
        ))}
      </div>
      <div className="px-2.5">
        {renderOverflowCount(node.dataFields.length, visibleFields.length)}
      </div>
    </section>
  )
}

function UserJourneyAccessCardBody({
  node,
  surfaceStyle,
}: UserJourneyNodeBodyProps) {
  const visibleFields = node.dataFields.slice(0, 3)

  return (
    <section
      className="mt-3 h-[7.25rem] shrink-0 overflow-hidden rounded-md bg-background px-2.5 py-2 ring-1 ring-border"
      data-user-journey-card-kind={node.surfaceKind}
    >
      <p className="text-[10px] font-semibold uppercase leading-4 text-muted-foreground">
        Access decision
      </p>
      <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="truncate rounded-sm bg-muted px-2 py-1 text-[10px] text-muted-foreground">
          user
        </div>
        <span className="text-[10px]" style={{ color: surfaceStyle.accent }}>
          →
        </span>
        <div className="truncate rounded-sm bg-muted px-2 py-1 text-right text-[10px] text-muted-foreground">
          org
        </div>
      </div>
      <ul className="mt-2 grid gap-1">
        {visibleFields.map((field) => (
          <li key={field} className="truncate text-[11px] leading-4 text-foreground">
            {field}
          </li>
        ))}
      </ul>
    </section>
  )
}

function UserJourneyCheckpointCardBody({
  node,
  surfaceStyle,
}: UserJourneyNodeBodyProps) {
  const visibleFields = node.dataFields.slice(0, 3)

  return (
    <section
      className="mt-3 h-[7.25rem] shrink-0 overflow-hidden rounded-md bg-background px-2.5 py-2 ring-1 ring-border"
      data-user-journey-card-kind={node.surfaceKind}
    >
      <p className="text-[10px] font-semibold uppercase leading-4 text-muted-foreground">
        Checkpoints
      </p>
      <div className="mt-1.5 grid gap-1">
        {visibleFields.map((field, index) => (
          <div key={field} className="flex min-w-0 items-center gap-2">
            <span
              className="grid size-4 shrink-0 place-items-center rounded-full text-[9px] font-semibold text-background"
              style={{ backgroundColor: surfaceStyle.accent }}
            >
              {index + 1}
            </span>
            <span className="truncate text-[11px] leading-4 text-foreground">
              {field}
            </span>
          </div>
        ))}
      </div>
      {renderOverflowCount(node.dataFields.length, visibleFields.length)}
    </section>
  )
}

function UserJourneyTelemetryCardBody({ node }: UserJourneyNodeBodyProps) {
  const visibleFields = node.dataFields.slice(0, 3)

  return (
    <section
      className="mt-3 h-[7.25rem] shrink-0 overflow-hidden rounded-md bg-background px-2.5 py-2 ring-1 ring-border"
      data-user-journey-card-kind={node.surfaceKind}
    >
      <div className="flex items-center justify-between border-b border-border pb-1.5">
        <p className="text-[10px] font-semibold uppercase leading-4 text-muted-foreground">
          Event coverage
        </p>
        <ActivityIcon aria-hidden="true" className="size-3.5 text-muted-foreground" />
      </div>
      <div className="mt-1.5 grid gap-1">
        {visibleFields.map((field) => (
          <div key={field} className="grid grid-cols-[3.75rem_minmax(0,1fr)] gap-2 text-[11px] leading-4">
            <span className="font-semibold text-muted-foreground">track</span>
            <span className="truncate text-foreground">{field}</span>
          </div>
        ))}
      </div>
      {renderOverflowCount(node.dataFields.length, visibleFields.length)}
    </section>
  )
}

function UserJourneyCoachingCardBody({
  node,
  surfaceStyle,
}: UserJourneyNodeBodyProps) {
  const visibleFields = node.dataFields.slice(0, 3)

  return (
    <section
      className="mt-3 h-[7.25rem] shrink-0 overflow-hidden rounded-md bg-background px-2.5 py-2 ring-1 ring-border"
      data-user-journey-card-kind={node.surfaceKind}
    >
      <p className="text-[10px] font-semibold uppercase leading-4 text-muted-foreground">
        Booking handoff
      </p>
      <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="truncate rounded-sm bg-muted px-2 py-1 text-[10px] text-muted-foreground">
          app
        </div>
        <span className="text-[10px]" style={{ color: surfaceStyle.accent }}>
          →
        </span>
        <div className="truncate rounded-sm bg-muted px-2 py-1 text-right text-[10px] text-muted-foreground">
          calendar
        </div>
      </div>
      <ul className="mt-2 grid gap-1">
        {visibleFields.map((field) => (
          <li key={field} className="truncate text-[11px] leading-4 text-foreground">
            {field}
          </li>
        ))}
      </ul>
    </section>
  )
}

function UserJourneyAiCardBody({ node }: UserJourneyNodeBodyProps) {
  const visibleFields = node.dataFields.slice(0, 3)

  return (
    <section
      className="mt-3 h-[7.25rem] shrink-0 overflow-hidden rounded-md bg-background px-2.5 py-2 ring-1 ring-border"
      data-user-journey-card-kind={node.surfaceKind}
    >
      <div className="flex items-center justify-between border-b border-border pb-1.5">
        <p className="text-[10px] font-semibold uppercase leading-4 text-muted-foreground">
          Assistant inputs
        </p>
        <BotIcon aria-hidden="true" className="size-3.5 text-muted-foreground" />
      </div>
      <div className="mt-1.5 grid gap-1">
        {visibleFields.map((field, index) => (
          <div
            key={field}
            className="grid grid-cols-[4.25rem_minmax(0,1fr)] items-center gap-2 rounded-sm border border-border bg-background px-2 py-1"
          >
            <span className="text-[9px] font-semibold uppercase leading-4 text-muted-foreground">
              Input {index + 1}
            </span>
            <span className="truncate text-[11px] leading-4 text-foreground">
              {field}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

function UserJourneyOutcomeCardBody({
  node,
  surfaceStyle,
}: UserJourneyNodeBodyProps) {
  const visibleFields = node.dataFields.slice(0, 3)

  return (
    <section
      className="mt-3 h-[7.25rem] shrink-0 overflow-hidden rounded-md bg-background px-2.5 py-2 ring-1 ring-border"
      data-user-journey-card-kind={node.surfaceKind}
    >
      <p className="text-[10px] font-semibold uppercase leading-4 text-muted-foreground">
        Value loop
      </p>
      <div className="mt-1.5 grid gap-1">
        {visibleFields.map((field) => (
          <div key={field} className="flex min-w-0 items-center gap-2">
            <BadgeCheckIcon
              aria-hidden="true"
              className="size-3.5 shrink-0"
              style={{ color: surfaceStyle.accent }}
            />
            <span className="truncate text-[11px] leading-4 text-foreground">
              {field}
            </span>
          </div>
        ))}
      </div>
      {renderOverflowCount(node.dataFields.length, visibleFields.length)}
    </section>
  )
}

export function UserJourneyDefaultCardBody(
  props: UserJourneyNodeBodyProps,
) {
  if (props.node.surfaceKind === "ai") return <UserJourneyAiCardBody {...props} />
  if (props.node.surfaceKind === "coaching") return <UserJourneyCoachingCardBody {...props} />
  if (props.node.surfaceKind === "email") return <UserJourneyEmailCardBody {...props} />
  if (props.node.surfaceKind === "form") return <UserJourneyFormCardBody {...props} />
  if (props.node.surfaceKind === "outcome") return <UserJourneyOutcomeCardBody {...props} />
  if (props.node.surfaceKind === "payment") return <UserJourneyPaymentCardBody {...props} />
  if (props.node.surfaceKind === "telemetry") return <UserJourneyTelemetryCardBody {...props} />
  if (props.node.surfaceKind === "data") return <UserJourneyDataCardBody {...props} />
  if (props.node.surfaceKind === "access") return <UserJourneyAccessCardBody {...props} />
  if (props.node.surfaceKind === "auth") return <UserJourneyCheckpointCardBody {...props} />

  return <UserJourneyRouteCardBody {...props} />
}
