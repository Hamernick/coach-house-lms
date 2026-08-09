"use client"

import * as React from "react"
import ArrowUpRightIcon from "lucide-react/dist/esm/icons/arrow-up-right"
import CircleIcon from "lucide-react/dist/esm/icons/circle"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { cn } from "@/lib/utils"

import type { FiscalSponsorshipProjectWorkflowEvent } from "../types"

const DEFAULT_PAGE_SIZE = 4

const TIMELINE_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  month: "short",
})

function formatTimelineEventType(eventType: string) {
  const label =
    eventType === "agreement_generated"
      ? "agreement prepared"
      : eventType.replaceAll("_", " ")

  return label.charAt(0).toUpperCase() + label.slice(1)
}

function formatTimelineEventSummary(
  event: FiscalSponsorshipProjectWorkflowEvent
) {
  if (event.eventType !== "agreement_generated") return event.summary

  return event.summary.replace(/\bgenerated\b/gi, "prepared")
}

function formatTimelineEventDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Date pending"

  return TIMELINE_DATE_FORMATTER.format(date)
}

function TimelineEventContent({
  event,
  linked,
}: {
  event: FiscalSponsorshipProjectWorkflowEvent
  linked: boolean
}) {
  return (
    <>
      <CircleIcon
        className="text-primary/55 mt-1.5 size-2 shrink-0 fill-current"
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="text-foreground min-w-0 flex-1 text-xs leading-snug font-medium text-pretty">
            {formatTimelineEventSummary(event)}
          </span>
          <Badge
            variant="secondary"
            className="h-6 max-w-full rounded-full border-transparent px-2 py-0.5 text-[11px] leading-none"
          >
            {formatTimelineEventType(event.eventType)}
          </Badge>
        </span>
        <time
          dateTime={event.createdAt}
          className="text-muted-foreground mt-0.5 block text-[11px] tabular-nums"
        >
          {formatTimelineEventDate(event.createdAt)}
        </time>
      </span>
      {linked ? (
        <ArrowUpRightIcon
          data-icon="inline-end"
          className="text-muted-foreground mt-1 shrink-0"
          aria-hidden
        />
      ) : null}
    </>
  )
}

function TimelineEventRow({
  event,
  href,
  onNavigate,
}: {
  event: FiscalSponsorshipProjectWorkflowEvent
  href: string | null
  onNavigate?: (href: string) => void
}) {
  const rowClassName =
    "group h-auto w-full min-w-0 items-start justify-start whitespace-normal rounded-xl px-2 py-2 text-left font-normal"

  if (!href) {
    return (
      <div
        className="flex min-w-0 items-start gap-2 rounded-xl px-2 py-2"
        data-fiscal-sponsorship-workflow-event={event.eventType}
      >
        <TimelineEventContent event={event} linked={false} />
      </div>
    )
  }

  const opensDocument = href.startsWith("/api/")

  return (
    <Button
      asChild
      variant="ghost"
      className={rowClassName}
      data-fiscal-sponsorship-workflow-event={event.eventType}
    >
      <a
        href={href}
        target={opensDocument ? "_blank" : undefined}
        rel={opensDocument ? "noreferrer" : undefined}
        onClick={(clickEvent) => {
          if (!href.startsWith("#") || !onNavigate) return
          clickEvent.preventDefault()
          onNavigate(href)
        }}
      >
        <TimelineEventContent event={event} linked />
      </a>
    </Button>
  )
}

export function FiscalSponsorshipWorkflowTimeline({
  className,
  emptyLabel = "No fiscal activity recorded yet.",
  events,
  onNavigate,
  pageSize = DEFAULT_PAGE_SIZE,
  resolveEventHref,
  variant = "default",
}: {
  className?: string
  emptyLabel?: string
  events: FiscalSponsorshipProjectWorkflowEvent[]
  onNavigate?: (href: string) => void
  pageSize?: number
  resolveEventHref?: (
    event: FiscalSponsorshipProjectWorkflowEvent
  ) => string | null
  variant?: "default" | "sidebar"
}) {
  const reduceMotion = useReducedMotion()
  const [page, setPage] = React.useState(1)
  const normalizedPageSize = Math.max(1, Math.floor(pageSize))
  const pageCount = Math.max(1, Math.ceil(events.length / normalizedPageSize))
  const currentPage = Math.min(page, pageCount)
  const visibleEvents = events.slice(
    (currentPage - 1) * normalizedPageSize,
    currentPage * normalizedPageSize
  )
  const sidebar = variant === "sidebar"

  function changePage(nextPage: number) {
    setPage(Math.min(Math.max(nextPage, 1), pageCount))
  }

  return (
    <section
      id="fiscal-sponsorship-recent-updates"
      data-fiscal-sponsorship-workflow-timeline=""
      className={cn("min-w-0", className)}
    >
      <div className={cn(sidebar ? "pb-4" : "px-1")}>
        <p
          className={cn(
            sidebar ? "text-base font-medium" : "text-sm font-semibold"
          )}
        >
          Recent updates
        </p>
        {!sidebar ? (
          <p className="text-muted-foreground mt-1 text-xs leading-snug text-pretty">
            Activity from applications, uploads, reviews, agreements, and
            signatures.
          </p>
        ) : null}
      </div>

      {events.length > 0 ? (
        <>
          <AnimatePresence mode="wait" initial>
            <motion.div
              key={currentPage}
              initial={reduceMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
              transition={{
                duration: reduceMotion ? 0 : 0.15,
                ease: "easeOut",
              }}
              className={cn("flex flex-col gap-1", !sidebar && "mt-2")}
            >
              {visibleEvents.map((event) => (
                <TimelineEventRow
                  key={event.id}
                  event={event}
                  href={resolveEventHref?.(event) ?? null}
                  onNavigate={onNavigate}
                />
              ))}
            </motion.div>
          </AnimatePresence>

          {pageCount > 1 ? (
            <Pagination
              aria-label="Recent updates pages"
              className="mx-0 mt-3 justify-start"
            >
              <PaginationContent className="w-full justify-between">
                <PaginationItem>
                  <PaginationPrevious
                    href="#fiscal-sponsorship-recent-updates"
                    aria-disabled={currentPage === 1}
                    tabIndex={currentPage === 1 ? -1 : undefined}
                    className={cn(
                      "h-8 rounded-full px-2",
                      currentPage === 1 && "pointer-events-none opacity-50"
                    )}
                    onClick={(event) => {
                      event.preventDefault()
                      changePage(currentPage - 1)
                    }}
                  />
                </PaginationItem>
                <PaginationItem>
                  <span
                    aria-live="polite"
                    className="text-muted-foreground text-xs tabular-nums"
                  >
                    {currentPage} of {pageCount}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#fiscal-sponsorship-recent-updates"
                    aria-disabled={currentPage === pageCount}
                    tabIndex={currentPage === pageCount ? -1 : undefined}
                    className={cn(
                      "h-8 rounded-full px-2",
                      currentPage === pageCount &&
                        "pointer-events-none opacity-50"
                    )}
                    onClick={(event) => {
                      event.preventDefault()
                      changePage(currentPage + 1)
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          ) : null}
        </>
      ) : (
        <p
          className={cn(
            "text-muted-foreground text-xs leading-snug text-pretty",
            !sidebar && "px-1 pt-2"
          )}
        >
          {emptyLabel}
        </p>
      )}
    </section>
  )
}
