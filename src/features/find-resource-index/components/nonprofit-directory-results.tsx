"use client"

import { useEffect, useRef, useState } from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import type { NonprofitDirectorySearchResponse } from "../nonprofit-types"
import { loadNonprofitDirectoryPage } from "../lib/nonprofit-directory-client"

function sourceDate(period: string | null) {
  if (!period) return "IRS filing"
  const date = new Date(`${period}T12:00:00Z`)
  return Number.isNaN(date.getTime())
    ? "IRS filing"
    : `IRS filing ending ${new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric", timeZone: "UTC" }).format(date)}`
}

function SearchPage({ query }: { query: string }) {
  const heading = useRef<HTMLHeadingElement>(null)
  const pageNavigation = useRef(false)
  const [cursor, setCursor] = useState<string | null>(null)
  const [payload, setPayload] =
    useState<NonprofitDirectorySearchResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    const restore = () => {
      const params = new URL(window.location.href).searchParams
      setCursor(
        params.get("nfpQuery") === query ? params.get("nfpCursor") : null
      )
    }
    restore()
    window.addEventListener("popstate", restore)
    return () => window.removeEventListener("popstate", restore)
  }, [query])
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(false)
    setPayload(null)
    const timer = window.setTimeout(async () => {
      try {
        const result = await loadNonprofitDirectoryPage(
          query,
          cursor,
          controller.signal
        )
        if (!controller.signal.aborted) setPayload(result)
      } catch {
        if (!controller.signal.aborted) setError(true)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 250)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [query, cursor, retry])

  useEffect(() => {
    if (!loading && pageNavigation.current) {
      heading.current?.focus()
      pageNavigation.current = false
    }
  }, [loading])

  const navigate = (next: string | null) => {
    pageNavigation.current = true
    const url = new URL(window.location.href)
    if (next) {
      url.searchParams.set("nfpCursor", next)
      url.searchParams.set("nfpQuery", query)
    } else {
      url.searchParams.delete("nfpCursor")
      url.searchParams.delete("nfpQuery")
    }
    window.history.pushState(window.history.state, "", url)
    setCursor(next)
  }
  if (!loading && !error && payload?.items.length === 0 && !cursor) return null
  return (
    <section
      className="min-w-0 p-3"
      aria-label="Nonprofit organizations"
      aria-busy={loading}
    >
      <h3 ref={heading} tabIndex={-1} className="text-sm font-semibold">
        Nonprofit organizations
      </h3>
      <p className="text-muted-foreground mt-1 text-xs">
        IRS-listed organizations. Current operating status, services and
        visiting locations are unconfirmed. City and state come from filing
        addresses.
      </p>
      <div
        role="status"
        aria-live="polite"
        className="text-muted-foreground text-xs"
      >
        {loading
          ? "Loading organizations…"
          : error
            ? "Organizations could not load."
            : payload?.items.length === 0
              ? "No more organizations match."
              : null}
      </div>
      {error ? (
        <Button
          variant="ghost"
          className="min-h-11"
          onClick={() => setRetry((n) => n + 1)}
        >
          Try again
        </Button>
      ) : null}
      <Accordion type="single" collapsible>
        {payload?.items.map((item) => (
          <AccordionItem value={item.ein} key={item.ein}>
            <AccordionTrigger className="min-h-11 break-words">
              <span className="min-w-0">
                <span className="block">{item.name}</span>
                <span className="text-muted-foreground block text-xs font-normal">
                  {[item.city, item.state].filter(Boolean).join(", ")}
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 break-words">
              <p className="text-muted-foreground text-xs">
                EIN {item.ein.slice(0, 2)}-{item.ein.slice(2)}
              </p>
              {item.description ? (
                <div>
                  <p>{item.description}</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {sourceDate(item.descriptionSourcePeriod)}
                  </p>
                </div>
              ) : null}
              {item.website ? (
                <div>
                  <Button asChild variant="link" className="min-h-11 px-0">
                    <a
                      href={item.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Organization website
                    </a>
                  </Button>
                  <p className="text-muted-foreground text-xs">
                    {sourceDate(item.websiteSourcePeriod)}
                    {item.websiteBasis === "provider_confirmed"
                      ? "; also checked against the provider website"
                      : ""}
                  </p>
                </div>
              ) : null}
              {item.phone ? (
                <div>
                  <Button asChild variant="link" className="min-h-11 px-0">
                    <a href={`tel:${item.phone}`}>{item.phone}</a>
                  </Button>
                  <p className="text-muted-foreground text-xs">
                    {sourceDate(item.phoneSourcePeriod)}
                    {item.phoneBasis === "provider_confirmed"
                      ? "; also checked against the provider website"
                      : ""}
                  </p>
                </div>
              ) : null}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <div className="flex flex-wrap gap-2">
        {cursor ? (
          <Button
            variant="ghost"
            className="min-h-11"
            disabled={loading}
            onClick={() => navigate(null)}
          >
            First results
          </Button>
        ) : null}
        {payload?.page.hasMore && payload.page.nextCursor ? (
          <Button
            variant="outline"
            className="min-h-11"
            disabled={loading}
            onClick={() => navigate(payload.page.nextCursor)}
          >
            Next organizations
          </Button>
        ) : null}
      </div>
    </section>
  )
}

export function NonprofitDirectoryResults({
  query,
  enabled = true,
}: {
  query: string
  enabled?: boolean
}) {
  const normalized = query.trim()
  if (!enabled || normalized.length < 2 || normalized.length > 160) return null
  return <SearchPage key={normalized} query={normalized} />
}
