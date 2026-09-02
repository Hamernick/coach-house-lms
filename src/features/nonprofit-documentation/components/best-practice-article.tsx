import type { ReactNode } from "react"
import Link from "next/link"
import ArrowLeftIcon from "lucide-react/dist/esm/icons/arrow-left"
import ArrowRightIcon from "lucide-react/dist/esm/icons/arrow-right"

import { DOCUMENTATION_PATH } from "../lib"
import type { BestPracticeArticle } from "../types"
import {
  BestPracticeChecklistAndMistakes,
  BestPracticeCoreSections,
  BestPracticeExampleAndFramework,
  BestPracticeMeasuresAndSources,
  BestPracticeStagesSection,
} from "./best-practice-article-sections"
import {
  DocumentationJsonLd,
  DocumentationSurface,
} from "./documentation-surface"

const baseContents = [
  ["definition", "Definition"],
  ["why-it-matters", "Why it matters"],
  ["stages", "Guidance by stage"],
] as const

const closingContents = [
  ["example", "Example"],
  ["framework", "Framework"],
  ["checklist", "Checklist"],
  ["mistakes", "Common mistakes"],
  ["measures", "Evidence"],
  ["sources", "Sources"],
] as const

function ArticleFooter({ article }: { article: BestPracticeArticle }) {
  const previous = article.previous ?? {
    title: "Documentation home",
    href: DOCUMENTATION_PATH,
  }

  return (
    <footer className="grid gap-4 border-t pt-8 sm:grid-cols-2">
      <Link
        href={previous.href}
        className="hover:bg-muted/45 focus-visible:ring-ring flex min-h-20 items-center gap-3 border p-4 transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <ArrowLeftIcon className="size-4" aria-hidden />
        <span>
          <span className="text-muted-foreground block text-xs">Previous</span>
          <span className="font-semibold">{previous.title}</span>
        </span>
      </Link>
      {article.next?.href ? (
        <Link
          href={article.next.href}
          className="hover:bg-muted/45 focus-visible:ring-ring flex min-h-20 items-center justify-between gap-3 border p-4 transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <span>
            <span className="text-muted-foreground block text-xs">
              Next guide
            </span>
            <span className="font-semibold">{article.next.title}</span>
          </span>
          <ArrowRightIcon className="size-4" aria-hidden />
        </Link>
      ) : (
        <div
          className="text-muted-foreground flex min-h-20 items-center justify-between gap-3 border p-4"
          aria-disabled="true"
        >
          <span>
            <span className="block text-xs">Next guide</span>
            <span className="text-foreground font-semibold">
              {article.next?.title ?? "More guidance coming soon"}
            </span>
          </span>
          <ArrowRightIcon className="size-4" aria-hidden />
        </div>
      )}
    </footer>
  )
}

export function BestPracticeArticlePage({
  article,
  interactive,
}: {
  article: BestPracticeArticle
  interactive?: ReactNode
}) {
  const canonicalUrl = `https://coachhouse.app/documentation/${article.slug}`
  const contents: ReadonlyArray<readonly [string, string]> = interactive
    ? [...baseContents, ["sandbox", "Try it"], ...closingContents]
    : [...baseContents, ...closingContents]

  return (
    <DocumentationSurface>
      <DocumentationJsonLd
        value={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.description,
          dateModified: article.modifiedDate,
          datePublished: article.publishedDate,
          mainEntityOfPage: canonicalUrl,
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
              name: article.navigationTitle,
              item: canonicalUrl,
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
              {article.navigationTitle}
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

          <BestPracticeCoreSections article={article} />
          <BestPracticeStagesSection article={article} />
          {interactive}
          <BestPracticeExampleAndFramework article={article} />
          <BestPracticeChecklistAndMistakes article={article} />
          <BestPracticeMeasuresAndSources article={article} />
          <ArticleFooter article={article} />
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
                      className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex min-h-7 items-center text-xs leading-5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
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
