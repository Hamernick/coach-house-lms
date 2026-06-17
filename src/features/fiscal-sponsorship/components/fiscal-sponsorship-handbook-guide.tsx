"use client"

import type { MouseEvent } from "react"

import BookOpenIcon from "lucide-react/dist/esm/icons/book-open"
import DownloadIcon from "lucide-react/dist/esm/icons/download"
import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"
import ReactMarkdown from "react-markdown"
import remarkBreaks from "remark-breaks"
import remarkGfm from "remark-gfm"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

import {
  FISCAL_SPONSORSHIP_HANDBOOK_DOWNLOAD_HREF,
  FISCAL_SPONSORSHIP_HANDBOOK_GUIDE_SECTIONS,
  FISCAL_SPONSORSHIP_HANDBOOK_HREF,
  FISCAL_SPONSORSHIP_HANDBOOK_NAV_ITEMS,
} from "../lib/application-data"

function handleHandbookSectionClick(
  sectionId: string,
  event: MouseEvent<HTMLAnchorElement>
) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return
  }

  const section = document.getElementById(sectionId)

  if (!section) {
    return
  }

  event.preventDefault()

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches

  section.scrollIntoView({
    behavior: prefersReducedMotion ? "auto" : "smooth",
    block: "start",
  })
  window.history.replaceState(null, "", `#${sectionId}`)
}

export function FiscalSponsorshipHandbookGuide() {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-background border-border/60 rounded-2xl border p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="bg-primary/10 text-primary inline-flex size-9 shrink-0 items-center justify-center rounded-full">
              <BookOpenIcon className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                Fiscal sponsorship handbook
              </p>
              <p className="text-muted-foreground mt-1 text-sm leading-snug">
                This guide is pulled from the 2026 Coach House handbook. Use it
                as the source for generated applications, agreements,
                disclosures, grant requests, and review controls.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full"
            >
              <a
                href={FISCAL_SPONSORSHIP_HANDBOOK_HREF}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLinkIcon data-icon="inline-start" />
                Open viewer
              </a>
            </Button>
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <a href={FISCAL_SPONSORSHIP_HANDBOOK_DOWNLOAD_HREF} download>
                <DownloadIcon data-icon="inline-start" />
                Download
              </a>
            </Button>
          </div>
        </div>
      </div>
      <div className="bg-background border-border/60 overflow-hidden rounded-2xl border">
        <div className="bg-muted/35 border-border/60 border-b px-4 py-3">
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Handbook sections
          </p>
          <nav
            aria-label="Fiscal sponsorship handbook sections"
            className="mt-3 grid gap-1.5 sm:grid-cols-2"
          >
            {FISCAL_SPONSORSHIP_HANDBOOK_NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(event) => handleHandbookSectionClick(item.id, event)}
                className="group border-border/0 hover:border-border/60 hover:bg-background focus-visible:border-ring focus-visible:ring-ring/50 flex min-w-0 flex-col rounded-xl border px-2.5 py-2 text-left text-sm font-medium transition-[background-color,border-color,box-shadow,color,transform] outline-none hover:-translate-y-0.5 hover:shadow-xs focus-visible:ring-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                <span className="group-hover:text-foreground block truncate">
                  {item.label}
                </span>
                <span className="text-muted-foreground group-hover:text-foreground/70 mt-0.5 line-clamp-1 block text-xs font-normal">
                  {item.description}
                </span>
              </a>
            ))}
          </nav>
        </div>
        {FISCAL_SPONSORSHIP_HANDBOOK_GUIDE_SECTIONS.map((section, index) => (
          <section
            key={section.id}
            id={section.id}
            className="scroll-mt-4 px-4 py-4"
          >
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge className="bg-primary/10 text-primary h-7 rounded-full border-transparent px-2.5 py-1 leading-none">
                {section.eyebrow}
              </Badge>
              <h3 className="text-foreground text-base leading-6 font-semibold">
                {section.title}
              </h3>
            </div>
            <article className="tiptap prose prose-sm dark:prose-invert prose-headings:tracking-tight prose-p:leading-relaxed prose-li:my-1 prose-blockquote:border-l-primary/50 prose-blockquote:text-muted-foreground max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                components={{
                  h1: "h4",
                  h2: "h4",
                  h3: "h5",
                }}
              >
                {section.markdown}
              </ReactMarkdown>
            </article>
            {index < FISCAL_SPONSORSHIP_HANDBOOK_GUIDE_SECTIONS.length - 1 ? (
              <Separator className="mt-4 border-t border-dashed bg-transparent" />
            ) : null}
          </section>
        ))}
      </div>
    </div>
  )
}
