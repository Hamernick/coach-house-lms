import type { ReactNode } from "react"
import Link from "next/link"
import ArrowLeftIcon from "lucide-react/dist/esm/icons/arrow-left"
import ArrowRightIcon from "lucide-react/dist/esm/icons/arrow-right"

import { DOCUMENTATION_PATH } from "../lib"
import { getDocumentationToolMetadata } from "../lib/documentation-tools"
import { DocumentationArticleWorkspace } from "./documentation-article-workspace"
import { DocumentationPageHeader } from "./documentation-page-header"
import type { BestPracticeArticle } from "../types"
import {
  DocumentationDesktopContents,
  DocumentationMobileContents,
} from "./documentation-contents"
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
    <footer className="grid gap-4 border-t pt-5 sm:grid-cols-2">
      <Link
        href={previous.href}
        className="hover:bg-muted/45 focus-visible:ring-ring flex min-h-16 items-center gap-3 rounded-xl border p-4 transition-colors focus-visible:ring-2 focus-visible:outline-none"
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
          className="hover:bg-muted/45 focus-visible:ring-ring flex min-h-16 items-center justify-between gap-3 rounded-xl border p-4 transition-colors focus-visible:ring-2 focus-visible:outline-none"
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
          className="text-muted-foreground flex min-h-16 items-center justify-between gap-3 rounded-xl border p-4"
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
  const toolMetadata = getDocumentationToolMetadata(article.slug)
  const canonicalUrl = `https://coachhouse.app/documentation/${article.slug}`
  const sectionLabel = article.slug.startsWith("tools/")
    ? "Tools"
    : "Best practices"
  const contents: ReadonlyArray<readonly [string, string]> = interactive
    ? [...baseContents, ["sandbox", "Try it"], ...closingContents]
    : [...baseContents, ...closingContents]

  const continuation = (
    <>
      <BestPracticeExampleAndFramework article={article} />
      <BestPracticeChecklistAndMistakes article={article} />
      <BestPracticeMeasuresAndSources article={article} />
    </>
  )

  const guide = (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,760px)_180px]">
      <div className="min-w-0">
        <DocumentationMobileContents items={contents} />
        <p className="text-muted-foreground mt-3 text-xs">
          {article.readingTime} · Reviewed {article.reviewedDate}
        </p>
        <BestPracticeCoreSections article={article} />
        <BestPracticeStagesSection article={article} />
        {!interactive && continuation}
      </div>
      <DocumentationDesktopContents items={contents} />
    </div>
  )

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
            { "@type": "ListItem", position: 2, name: sectionLabel },
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
        className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8"
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
            <span>{sectionLabel}</span>
            <span aria-hidden>/</span>
            <span aria-current="page" className="text-foreground">
              {article.navigationTitle}
            </span>
          </nav>

          <DocumentationPageHeader
            artwork={article.slug}
            eyebrow={sectionLabel}
            title={article.navigationTitle}
            description={toolMetadata?.description ?? article.description}
          />
          {interactive ? (
            <DocumentationArticleWorkspace
              guide={guide}
              tool={interactive}
              continuation={
                <div className="grid gap-6 xl:grid-cols-[minmax(0,760px)_180px]">
                  <div className="min-w-0">{continuation}</div>
                </div>
              }
            />
          ) : (
            guide
          )}
          <ArticleFooter article={article} />
        </article>
      </div>
    </DocumentationSurface>
  )
}
