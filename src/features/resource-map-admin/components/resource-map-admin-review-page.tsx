import Link from "next/link"

import ClipboardCheckIcon from "lucide-react/dist/esm/icons/clipboard-check"
import DatabaseIcon from "lucide-react/dist/esm/icons/database"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

import type {
  ResourceMapAdminImportRecordRow,
  ResourceMapAdminReviewFormActions,
  ResourceMapAdminReviewQueue,
  ResourceMapAdminReviewRecord as ResourceMapAdminReviewRecordData,
} from "../types"
import { ResourceMapReviewLink } from "./resource-map-review-actions"
import { ResourceMapReviewRecord } from "./resource-map-review-record"

function statusVariant(status: string) {
  if (status === "approved") return "default" as const
  if (status === "stale" || status === "rejected") return "destructive" as const
  return "outline" as const
}

function QueueItem({
  item,
  selected,
  page,
}: {
  item: ResourceMapAdminImportRecordRow
  selected: boolean
  page: number
}) {
  return (
    <li>
      <ResourceMapReviewLink
        href={`/admin/platform/resource-map?page=${page}&record=${encodeURIComponent(item.id)}`}
        current={selected}
        className={cn(
          "hover:border-foreground/30 hover:bg-muted/45 focus-visible:ring-ring flex min-h-11 min-w-0 items-start justify-between gap-3 rounded-md border px-3 py-2 text-left outline-none focus-visible:ring-2",
          selected && "border-foreground/30 bg-muted/65"
        )}
      >
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">
            {item.normalized_name ??
              item.source_record_id ??
              "Untitled Resource"}
          </span>
          <span className="text-muted-foreground mt-1 block truncate font-mono text-xs">
            {item.source_record_id ?? item.id}
          </span>
        </span>
        <Badge variant={statusVariant(item.review_status)} className="shrink-0">
          {item.review_status.replaceAll("_", " ")}
        </Badge>
      </ResourceMapReviewLink>
    </li>
  )
}

export function ResourceMapAdminReviewPage({
  queue,
  detail,
  actions,
}: {
  queue: ResourceMapAdminReviewQueue
  detail: ResourceMapAdminReviewRecordData | null
  actions: Pick<
    ResourceMapAdminReviewFormActions,
    "reviewImportRecord" | "setPublicVisibility"
  >
}) {
  const counts = queue.imports.reduce<Record<string, number>>(
    (result, item) => {
      result[item.review_status] = (result[item.review_status] ?? 0) + 1
      return result
    },
    {}
  )
  const totalPages = Math.max(Math.ceil(queue.totalImports / queue.pageSize), 1)

  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-[1400px] space-y-4 px-4 py-5 md:px-6 md:py-6"
    >
      <a
        href="#resource-review-workspace"
        className="bg-background focus:ring-ring sr-only z-50 min-h-11 rounded-md px-4 py-3 text-sm font-medium shadow-lg focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:ring-2 focus:outline-none"
      >
        Skip To Review Workspace
      </a>
      <header className="border-border/70 flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="text-muted-foreground mb-2 flex items-center gap-2 text-sm font-medium">
            <ClipboardCheckIcon className="size-4" aria-hidden />
            Evidence-First Review
          </div>
          <h1 className="scroll-mt-24 text-2xl font-semibold tracking-tight text-balance">
            Resource Map Review
          </h1>
          <p className="text-muted-foreground mt-2 max-w-3xl text-sm leading-6">
            Compare authoritative evidence, AI output, verification, conflicts,
            and public visibility before approving a record.
          </p>
        </div>
        <dl className="grid grid-cols-3 gap-2 text-center tabular-nums">
          <div className="rounded-md border px-3 py-2">
            <dt className="text-muted-foreground text-xs">Queue</dt>
            <dd className="mt-1 text-lg font-semibold">{queue.totalImports}</dd>
          </div>
          <div className="rounded-md border px-3 py-2">
            <dt className="text-muted-foreground text-xs">Page Needs Review</dt>
            <dd className="mt-1 text-lg font-semibold">
              {(counts.needs_review ?? 0) + (counts.new ?? 0)}
            </dd>
          </div>
          <div className="rounded-md border px-3 py-2">
            <dt className="text-muted-foreground text-xs">Page Approved</dt>
            <dd className="mt-1 text-lg font-semibold">
              {counts.approved ?? 0}
            </dd>
          </div>
        </dl>
      </header>

      <div
        id="resource-review-workspace"
        tabIndex={-1}
        className="focus:outline-none"
      >
        {queue.imports.length === 0 ? (
          <Card className="mx-auto max-w-xl">
            <CardHeader>
              <DatabaseIcon
                className="text-muted-foreground mb-2 size-5"
                aria-hidden
              />
              <CardTitle>
                <h2 className="scroll-mt-24">No Records Await Review</h2>
              </CardTitle>
              <CardDescription>
                Import a source-verified batch to create staged records.
                Published resources remain unchanged.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="h-11 sm:h-9">
                <Link href="/admin/platform">Return To Platform</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
            <aside
              className="min-w-0 lg:sticky lg:top-4"
              aria-label="Review queue"
            >
              <details open className="bg-card rounded-md border shadow-sm">
                <summary className="focus-visible:ring-ring min-h-11 cursor-pointer px-4 py-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-inset">
                  Review Queue · Page {queue.page} Of {totalPages}
                </summary>
                <div className="max-h-[22rem] overflow-y-auto overscroll-contain border-t p-2 lg:max-h-[calc(100vh-12rem)]">
                  <ol className="grid gap-2">
                    {queue.imports.map((item) => (
                      <QueueItem
                        key={item.id}
                        item={item}
                        selected={detail?.record.id === item.id}
                        page={queue.page}
                      />
                    ))}
                  </ol>
                  {totalPages > 1 ? (
                    <nav
                      aria-label="Review queue pages"
                      className="mt-3 grid grid-cols-2 gap-2 border-t pt-3"
                    >
                      {queue.page > 1 ? (
                        <ResourceMapReviewLink
                          href={`/admin/platform/resource-map?page=${queue.page - 1}`}
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                            "h-11 sm:h-8"
                          )}
                        >
                          Previous Page
                        </ResourceMapReviewLink>
                      ) : (
                        <span />
                      )}
                      {queue.page < totalPages ? (
                        <ResourceMapReviewLink
                          href={`/admin/platform/resource-map?page=${queue.page + 1}`}
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                            "h-11 sm:h-8"
                          )}
                        >
                          Next Page
                        </ResourceMapReviewLink>
                      ) : null}
                    </nav>
                  ) : null}
                </div>
              </details>
            </aside>
            {detail ? (
              <ResourceMapReviewRecord detail={detail} actions={actions} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>
                    <h2 className="scroll-mt-24">Select A Record</h2>
                  </CardTitle>
                  <CardDescription>
                    Choose a staged record from the queue to inspect its
                    evidence.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
