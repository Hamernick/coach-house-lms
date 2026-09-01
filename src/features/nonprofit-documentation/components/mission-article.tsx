import Link from "next/link"
import ArrowLeftIcon from "lucide-react/dist/esm/icons/arrow-left"
import ArrowRightIcon from "lucide-react/dist/esm/icons/arrow-right"

import { DOCUMENTATION_PATH, MISSION_ARTICLE } from "../lib"
import {
  DocumentationJsonLd,
  DocumentationSurface,
} from "./documentation-surface"
import {
  MissionChecklistAndMistakes,
  MissionCoreSections,
  MissionExampleAndFramework,
  MissionMeasuresAndSources,
  MissionStagesSection,
} from "./mission-article-sections"

const contents = [
  ["definition", "Definition"],
  ["why-it-matters", "Why it matters"],
  ["stages", "Guidance by stage"],
  ["example", "Example"],
  ["framework", "Five-step framework"],
  ["checklist", "Checklist"],
  ["mistakes", "Common mistakes"],
  ["measures", "What to measure"],
  ["sources", "Sources"],
] as const

export function MissionArticlePage() {
  const article = MISSION_ARTICLE

  return (
    <DocumentationSurface>
      <DocumentationJsonLd
        value={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.description,
          dateModified: "2026-08-31",
          datePublished: "2026-08-31",
          mainEntityOfPage: `https://coachhouse.app/documentation/${article.slug}`,
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
            { "@type": "ListItem", position: 2, name: "Best practices" },
            {
              "@type": "ListItem",
              position: 3,
              name: "Mission",
              item: "https://coachhouse.app/documentation/best-practices/mission",
            },
          ],
        }}
      />
      <div
        id="documentation-content"
        className="mx-auto grid w-full max-w-[1180px] gap-14 px-5 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16 xl:grid-cols-[minmax(0,760px)_220px]"
      >
        <article className="min-w-0">
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
            <span>Best practices</span>
            <span aria-hidden>/</span>
            <span aria-current="page" className="text-foreground">
              Mission
            </span>
          </nav>

          <header className="mt-8 border-b pb-10">
            <p className="text-muted-foreground text-xs font-semibold tracking-[0.15em] uppercase">
              {article.eyebrow}
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-balance sm:text-5xl">
              {article.title}
            </h1>
            <p className="mt-6 text-lg leading-8 text-pretty sm:text-xl sm:leading-9">
              {article.answer}
            </p>
            <div className="text-muted-foreground mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs">
              <span>{article.readingTime}</span>
              <span>Reviewed {article.reviewedDate}</span>
              <span>United States</span>
            </div>
          </header>

          <MissionCoreSections article={article} />
          <MissionStagesSection article={article} />
          <MissionExampleAndFramework article={article} />
          <MissionChecklistAndMistakes article={article} />
          <MissionMeasuresAndSources article={article} />

          <footer className="grid gap-4 border-t pt-8 sm:grid-cols-2">
            <Link
              href={DOCUMENTATION_PATH}
              className="hover:bg-muted/45 flex min-h-20 items-center gap-3 border p-4 transition-colors"
            >
              <ArrowLeftIcon className="size-4" aria-hidden />
              <span>
                <span className="text-muted-foreground block text-xs">
                  Back to
                </span>
                <span className="font-semibold">Documentation home</span>
              </span>
            </Link>
            <div
              className="text-muted-foreground flex min-h-20 items-center justify-between gap-3 border p-4"
              aria-disabled="true"
            >
              <span>
                <span className="block text-xs">Next guide</span>
                <span className="text-foreground font-semibold">
                  Compliance
                </span>
              </span>
              <ArrowRightIcon className="size-4" aria-hidden />
            </div>
          </footer>
        </article>

        <aside className="hidden xl:block" aria-label="On this page">
          <div className="sticky top-8 border-l pl-5">
            <p className="text-xs font-semibold tracking-[0.12em] uppercase">
              On this page
            </p>
            <nav className="mt-4" aria-label="Article contents">
              <ol className="space-y-3">
                {contents.map(([id, label]) => (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      className="text-muted-foreground hover:text-foreground text-xs leading-5 transition-colors"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        </aside>
      </div>
    </DocumentationSurface>
  )
}
