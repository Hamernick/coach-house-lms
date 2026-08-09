"use client"

import CircleDollarSignIcon from "lucide-react/dist/esm/icons/circle-dollar-sign"
import ChevronLeftIcon from "lucide-react/dist/esm/icons/chevron-left"
import ChevronRightIcon from "lucide-react/dist/esm/icons/chevron-right"
import SearchIcon from "lucide-react/dist/esm/icons/search"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Empty } from "@/components/ui/empty"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"

import {
  buildWorkspaceFinanceActivityItems,
  type WorkspaceFinanceActivityItem,
} from "../lib/activity"
import { GRANTS_GOV_ATTRIBUTION_NOTICE } from "../lib/grants-gov"
import type {
  WorkspaceFinanceDataState,
  WorkspaceFinanceOpportunityInput,
  WorkspaceFinanceOpportunityWorkflowStatus,
  WorkspaceFinanceRecordInput,
} from "../types"
import { WorkspaceFinanceOpportunityStatusMenu } from "./workspace-finance-opportunity-status-menu"

const PAGE_SIZE = 6

const recordStatusLabels = {
  draft: "Draft",
  recorded: "Recorded",
  reconciled: "Verified",
} as const

function formatDate(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

function formatCurrency(record: WorkspaceFinanceRecordInput) {
  if (record.amountCents == null || !record.direction) return null
  const amount =
    record.direction === "out" ? -record.amountCents : record.amountCents
  const requestedCurrency = record.currencyCode?.trim().toUpperCase() || "USD"
  const currency = /^[A-Z]{3}$/.test(requestedCurrency)
    ? requestedCurrency
    : "USD"
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(amount / 100)
}

function WorkspaceFinanceOpportunityRow({
  opportunity,
}: {
  opportunity: WorkspaceFinanceOpportunityInput
}) {
  const [status, setStatus] =
    useState<WorkspaceFinanceOpportunityWorkflowStatus>(opportunity.status)
  const dueDate = formatDate(opportunity.dueAt)
  const detail = [opportunity.source, dueDate && `Due ${dueDate}`]
    .filter(Boolean)
    .join(" · ")

  if (status === "dismissed") return null

  return (
    <Item
      asChild
      className="rounded-none border-0 bg-transparent px-0 py-3 hover:bg-transparent dark:bg-transparent"
    >
      <li>
        <ItemMedia className="bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-lg">
          <SearchIcon aria-hidden="true" className="size-4" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{opportunity.title}</ItemTitle>
          {detail ? (
            <ItemDescription className="mt-0.5 truncate text-xs">
              {detail}
            </ItemDescription>
          ) : null}
        </ItemContent>
        <ItemActions>
          <WorkspaceFinanceOpportunityStatusMenu
            opportunityId={opportunity.id}
            opportunityTitle={opportunity.title}
            status={status}
            onStatusChange={setStatus}
          />
        </ItemActions>
      </li>
    </Item>
  )
}

function WorkspaceFinanceActivityRow({
  item,
}: {
  item: WorkspaceFinanceActivityItem
}) {
  if (item.kind === "opportunity") {
    return <WorkspaceFinanceOpportunityRow opportunity={item.opportunity} />
  }

  const amount = formatCurrency(item.record)
  const effectiveDate = formatDate(item.record.effectiveAt)

  return (
    <Item
      asChild
      className="rounded-none border-0 bg-transparent px-0 py-3 hover:bg-transparent dark:bg-transparent"
    >
      <li>
        <ItemMedia className="bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-lg">
          <CircleDollarSignIcon aria-hidden="true" className="size-4" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{item.record.typeLabel}</ItemTitle>
          <ItemDescription className="mt-0.5 truncate text-xs">
            {[item.record.sourceLabel, item.record.programTitle, effectiveDate]
              .filter(Boolean)
              .join(" · ")}
          </ItemDescription>
        </ItemContent>
        <ItemActions className="flex-col items-end gap-1">
          {amount ? (
            <span className="text-sm font-medium tabular-nums">{amount}</span>
          ) : null}
          {item.record.status ? (
            <span className="text-muted-foreground text-[11px]">
              {item.record.correction?.state === "corrected"
                ? "Corrected"
                : recordStatusLabels[item.record.status]}
            </span>
          ) : null}
        </ItemActions>
      </li>
    </Item>
  )
}

export function WorkspaceFinanceActivityFeed({
  opportunities,
  opportunitiesState,
  records,
  recordsState,
}: {
  opportunities: WorkspaceFinanceOpportunityInput[]
  opportunitiesState: WorkspaceFinanceDataState
  records: WorkspaceFinanceRecordInput[]
  recordsState: WorkspaceFinanceDataState
}) {
  const [requestedPage, setRequestedPage] = useState(1)
  const items = buildWorkspaceFinanceActivityItems({ opportunities, records })
  const pageCount = Math.max(Math.ceil(items.length / PAGE_SIZE), 1)
  const currentPage = Math.min(requestedPage, pageCount)
  const visibleItems = items.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )
  const loading =
    !items.length &&
    (recordsState === "loading" || opportunitiesState === "loading")
  const unavailable =
    !items.length && recordsState === "error" && opportunitiesState === "error"
  const partiallyUnavailable =
    items.length > 0 &&
    (recordsState === "error" || opportunitiesState === "error")
  const showGrantsGovAttribution = opportunities.some(
    ({ attribution }) => attribution === "grants_gov"
  )

  return (
    <section aria-labelledby="workspace-finance-activity-title">
      <header>
        <h2
          id="workspace-finance-activity-title"
          className="text-sm font-semibold"
        >
          Activity
        </h2>
        <p className="text-muted-foreground mt-1 text-xs">
          Transactions and funding opportunities
        </p>
        {showGrantsGovAttribution ? (
          <p
            className="text-muted-foreground mt-2 max-w-2xl text-xs"
            role="note"
          >
            {GRANTS_GOV_ATTRIBUTION_NOTICE}
          </p>
        ) : null}
      </header>

      {loading ? (
        <div aria-label="Loading Finance activity" className="mt-3 divide-y">
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex items-center gap-3 py-3">
              <Skeleton className="size-8 rounded-lg" />
              <div className="grid flex-1 gap-2">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
      ) : unavailable || !items.length ? (
        <Empty
          variant="subtle"
          size="sm"
          className="mt-4 min-h-36 rounded-none border-0 bg-transparent p-0 shadow-none"
          title={unavailable ? "Activity unavailable" : "No activity yet"}
          description={
            unavailable
              ? "Transactions and opportunities could not be loaded."
              : "Transactions and opportunities will appear here."
          }
        />
      ) : (
        <>
          {partiallyUnavailable ? (
            <p className="text-muted-foreground mt-3 text-xs" role="status">
              Some activity could not be loaded.
            </p>
          ) : null}
          <ol className="mt-2 divide-y">
            {visibleItems.map((item) => (
              <WorkspaceFinanceActivityRow key={item.id} item={item} />
            ))}
          </ol>
          {pageCount > 1 ? (
            <Pagination className="mt-3 justify-between border-t pt-3">
              <PaginationContent className="w-full justify-between">
                <PaginationItem>
                  {currentPage > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      aria-label="Go to previous Finance activity page"
                      onClick={() => setRequestedPage(currentPage - 1)}
                      className="h-11 sm:h-9"
                    >
                      <ChevronLeftIcon data-icon="inline-start" />
                      <span className="hidden sm:block">Previous</span>
                    </Button>
                  ) : (
                    <span className="block w-9" />
                  )}
                </PaginationItem>
                <PaginationItem>
                  <span
                    className="text-muted-foreground px-2 text-xs tabular-nums"
                    aria-live="polite"
                  >
                    {currentPage} of {pageCount}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  {currentPage < pageCount ? (
                    <Button
                      type="button"
                      variant="ghost"
                      aria-label="Go to next Finance activity page"
                      onClick={() => setRequestedPage(currentPage + 1)}
                      className="h-11 sm:h-9"
                    >
                      <span className="hidden sm:block">Next</span>
                      <ChevronRightIcon data-icon="inline-end" />
                    </Button>
                  ) : (
                    <span className="block w-9" />
                  )}
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          ) : null}
        </>
      )}
    </section>
  )
}
