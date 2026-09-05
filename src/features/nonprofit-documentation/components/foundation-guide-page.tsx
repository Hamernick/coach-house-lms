import Link from "next/link"
import ArrowLeftIcon from "lucide-react/dist/esm/icons/arrow-left"
import ArrowRightIcon from "lucide-react/dist/esm/icons/arrow-right"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"

import type { FoundationGuide } from "../types"
import { DOCUMENTATION_PATH } from "../lib"
import { DocumentationPageHeader } from "./documentation-page-header"
import {
  DocumentationDesktopContents,
  DocumentationMobileContents,
} from "./documentation-contents"
import {
  DocumentationJsonLd,
  DocumentationSurface,
} from "./documentation-surface"

const datePublished = "2026-08-31"

export function FoundationGuidePage({ guide }: { guide: FoundationGuide }) {
  const canonical = `https://coachhouse.app/documentation/${guide.slug}`
  const contents = [
    ...guide.sections.map((section) => [section.id, section.title] as const),
    ["stages", "Guidance by stage"] as const,
    ["checklist", "Readiness checklist"] as const,
    ["sources", "Sources"] as const,
  ]

  return (
    <DocumentationSurface>
      <DocumentationJsonLd
        value={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: guide.title,
          description: guide.description,
          datePublished,
          dateModified: datePublished,
          mainEntityOfPage: canonical,
          author: { "@type": "Organization", name: "Coach House" },
          publisher: { "@type": "Organization", name: "Coach House" },
          isPartOf: {
            "@type": "CollectionPage",
            name: "Coach House Nonprofit Documentation",
            url: "https://coachhouse.app/documentation",
          },
        }}
      />
      <DocumentationJsonLd
        value={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Documentation",
              item: "https://coachhouse.app/documentation",
            },
            { "@type": "ListItem", position: 2, name: "Get started" },
            {
              "@type": "ListItem",
              position: 3,
              name: guide.slug === "quickstart" ? "Quickstart" : "Key concepts",
              item: canonical,
            },
          ],
        }}
      />
      <article
        id="documentation-content"
        className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8"
      >
        <GuideHeader guide={guide} />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,760px)_200px]">
          <div className="min-w-0">
            <DocumentationMobileContents items={contents} />
            <GuideSections guide={guide} />
            <GuideStages guide={guide} />
            <GuideChecklistAndSources guide={guide} />
            <GuideFooter guide={guide} />
          </div>

          <DocumentationDesktopContents items={contents} />
        </div>
      </article>
    </DocumentationSurface>
  )
}

function GuideHeader({ guide }: { guide: FoundationGuide }) {
  return (
    <>
      <nav
        aria-label="Breadcrumb"
        className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs"
      >
        <Link
          href={DOCUMENTATION_PATH}
          className="hover:text-foreground underline-offset-4 hover:underline"
        >
          Documentation
        </Link>
        <span aria-hidden>/</span>
        <span>Get started</span>
        <span aria-hidden>/</span>
        <span aria-current="page" className="text-foreground">
          {guide.slug === "quickstart" ? "Quickstart" : "Key concepts"}
        </span>
      </nav>
      <DocumentationPageHeader
        artwork={guide.slug}
        eyebrow={guide.eyebrow}
        title={guide.title}
        description={guide.answer}
      >
        <div className="text-muted-foreground flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
          <span>{guide.readingTime}</span>
          <span>Reviewed {guide.reviewedDate}</span>
          <span>United States</span>
        </div>
      </DocumentationPageHeader>
    </>
  )
}

function GuideSections({ guide }: { guide: FoundationGuide }) {
  return guide.sections.map((section) => (
    <section
      key={section.id}
      id={section.id}
      className="scroll-mt-8 border-b py-4 xl:first-of-type:pt-0"
      aria-labelledby={`${section.id}-title`}
    >
      <h2
        id={`${section.id}-title`}
        className="text-lg leading-tight font-semibold tracking-[-0.025em]"
      >
        {section.title}
      </h2>
      <p className="text-muted-foreground mt-1 text-sm leading-5">
        {section.introduction}
      </p>
      <dl className="mt-2 divide-y border-y">
        {section.entries.map((entry) => (
          <div
            key={entry.title}
            className="grid gap-2 py-3 sm:grid-cols-[11rem_1fr] sm:gap-6"
          >
            <dt className="font-semibold">{entry.title}</dt>
            <dd className="text-muted-foreground text-sm leading-5">
              <p>{entry.description}</p>
              {entry.detail ? <p className="mt-2">{entry.detail}</p> : null}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  ))
}

function GuideStages({ guide }: { guide: FoundationGuide }) {
  return (
    <section
      id="stages"
      className="scroll-mt-8 border-b py-4"
      aria-labelledby="stages-title"
    >
      <p className="text-muted-foreground text-xs font-semibold tracking-normal">
        Stage-specific guidance
      </p>
      <h2
        id="stages-title"
        className="mt-1 text-lg leading-tight font-semibold tracking-[-0.025em]"
      >
        Use the concept at your current stage
      </h2>
      <div className="mt-2 divide-y border-y">
        {guide.stages.map((stage, index) => (
          <section
            key={stage.id}
            aria-labelledby={`${stage.id}-title`}
            className="py-4"
          >
            <div className="grid gap-4 sm:grid-cols-[3rem_1fr]">
              <span className="text-muted-foreground font-mono text-xs">
                0{index + 1}
              </span>
              <div>
                <p className="text-muted-foreground text-xs font-semibold tracking-normal">
                  {stage.label}
                </p>
                <h3
                  id={`${stage.id}-title`}
                  className="mt-1 text-base font-semibold"
                >
                  {stage.question}
                </h3>
                <p className="text-muted-foreground mt-1 text-sm leading-5">
                  {stage.guidance}
                </p>
                <ul className="mt-2 list-disc space-y-2 pl-5">
                  {stage.actions.map((action) => (
                    <li key={action} className="pl-1 text-sm leading-5">
                      {action}
                    </li>
                  ))}
                </ul>
                <p className="bg-muted/45 mt-2 rounded-xl border p-4 text-sm leading-5">
                  <strong>Ready when:</strong> {stage.checkpoint}
                </p>
              </div>
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}

function GuideChecklistAndSources({ guide }: { guide: FoundationGuide }) {
  return (
    <>
      <section
        id="checklist"
        className="scroll-mt-8 border-b py-4"
        aria-labelledby="checklist-title"
      >
        <h2
          id="checklist-title"
          className="text-lg leading-tight font-semibold tracking-[-0.025em]"
        >
          Readiness checklist
        </h2>
        <ul className="bg-border mt-2 grid gap-px overflow-hidden rounded-xl border sm:grid-cols-2">
          {guide.checklist.map((item) => (
            <li
              key={item}
              className="bg-background grid grid-cols-[1.25rem_1fr] gap-3 p-4 text-sm leading-5"
            >
              <CheckIcon className="mt-1 size-4" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
      <section
        id="sources"
        className="scroll-mt-8 py-4"
        aria-labelledby="sources-title"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-xs font-semibold tracking-normal">
              Primary references
            </p>
            <h2
              id="sources-title"
              className="mt-1 text-lg leading-tight font-semibold tracking-[-0.025em]"
            >
              Sources and review
            </h2>
          </div>
          <span className="text-muted-foreground text-xs">
            Reviewed {guide.reviewedDate}
          </span>
        </div>
        <ul className="mt-2 divide-y border-y">
          {guide.sources.map((source) => (
            <li key={source.url} className="py-3">
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-start gap-2 font-semibold underline-offset-4 hover:underline"
              >
                {source.title}
                <ExternalLinkIcon
                  className="mt-1 size-3.5 shrink-0"
                  aria-hidden
                />
              </a>
              <p className="text-muted-foreground mt-1 text-xs">
                {source.publisher}
              </p>
              <p className="text-muted-foreground mt-2 text-sm leading-5">
                {source.note}
              </p>
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground mt-3 text-xs leading-5">
          Educational guidance only. Confirm current federal and state
          requirements with the responsible agency or a qualified professional.
        </p>
      </section>
    </>
  )
}

function GuideFooter({ guide }: { guide: FoundationGuide }) {
  const next =
    guide.slug === "quickstart"
      ? { href: `${DOCUMENTATION_PATH}/key-concepts`, label: "Key concepts" }
      : {
          href: `${DOCUMENTATION_PATH}/best-practices/mission`,
          label: "Mission",
        }
  return (
    <footer className="grid gap-4 border-t pt-5 sm:grid-cols-2">
      <Link
        href={DOCUMENTATION_PATH}
        className="hover:bg-muted/45 flex min-h-16 items-center gap-3 rounded-xl border p-4 transition-colors"
      >
        <ArrowLeftIcon className="size-4" aria-hidden />
        <span>
          <span className="text-muted-foreground block text-xs">Back to</span>
          <span className="font-semibold">Documentation home</span>
        </span>
      </Link>
      <Link
        href={next.href}
        className="hover:bg-muted/45 flex min-h-16 items-center justify-between gap-3 rounded-xl border p-4 transition-colors"
      >
        <span>
          <span className="text-muted-foreground block text-xs">
            Next guide
          </span>
          <span className="font-semibold">{next.label}</span>
        </span>
        <ArrowRightIcon className="size-4" aria-hidden />
      </Link>
    </footer>
  )
}
