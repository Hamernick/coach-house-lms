import Link from "next/link"
import ArrowUpRightIcon from "lucide-react/dist/esm/icons/arrow-up-right"
import SearchXIcon from "lucide-react/dist/esm/icons/search-x"

import { Button } from "@/components/ui/button"
import { Empty } from "@/components/ui/empty"
import {
  sanitizeDocumentationQuery,
  searchDocumentation,
} from "../lib/documentation-search"
import { DOCUMENTATION_SEARCH_DOCUMENTS } from "../lib/search-documents"
import { DocumentationSurface } from "./documentation-surface"
import density from "./documentation-density.module.css"

const suggestions = [
  "Mission",
  "Fundraising",
  "Compliance",
  "Brand identity",
  "CRM",
]

export function DocumentationSearchPage({
  query: rawQuery,
}: {
  query: unknown
}) {
  const query = sanitizeDocumentationQuery(rawQuery)
  const results = searchDocumentation(DOCUMENTATION_SEARCH_DOCUMENTS, query)

  return (
    <DocumentationSurface>
      <div
        id="documentation-content"
        className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8"
      >
        <header className="border-b pb-2">
          <div className={density.heading}>
            <p className="text-muted-foreground text-xs font-semibold tracking-normal">
              Documentation library
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              {query ? "Search results" : "Find your next step"}
            </h1>
            <p
              className="text-muted-foreground text-sm break-words"
              role="status"
            >
              {query
                ? `${results.length} ${results.length === 1 ? "page" : "pages"} for “${query}”`
                : "Search the guides, practical tools, and resources in the library."}
            </p>
          </div>
          {query ? (
            <Button asChild variant="link" className="mt-2 min-h-11 px-0">
              <Link href="/documentation/search">Clear search</Link>
            </Button>
          ) : null}
        </header>

        {results.length > 0 ? (
          <ol className="divide-y" aria-label="Documentation search results">
            {results.map((result) => (
              <li key={result.href}>
                <Link
                  href={result.href}
                  className="group hover:bg-muted/40 focus-visible:ring-ring -mx-3 flex min-w-0 gap-3 rounded-lg px-3 py-4 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground text-xs">
                      {result.category}
                      {result.sectionTitle ? ` / ${result.sectionTitle}` : ""}
                    </p>
                    <h2 className="mt-1 text-base font-semibold tracking-tight group-hover:underline group-hover:underline-offset-4">
                      {result.title}
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm leading-5 break-words">
                      {result.excerpt}
                    </p>
                  </div>
                  <ArrowUpRightIcon
                    className="text-muted-foreground mt-1 size-4 shrink-0"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            {query ? (
              <Empty
                variant="subtle"
                icon={<SearchXIcon aria-hidden />}
                title="No matching pages"
                description="Try fewer words or a broader topic. You can also browse the full library."
                actions={
                  <Button asChild variant="outline">
                    <Link href="/documentation">Browse documentation</Link>
                  </Button>
                }
              />
            ) : null}
            <section aria-labelledby="search-suggestions">
              <h2 id="search-suggestions" className="text-sm font-semibold">
                Explore a topic
              </h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    asChild
                    variant="outline"
                    className="min-h-11"
                  >
                    <Link
                      href={`/documentation/search?q=${encodeURIComponent(suggestion)}`}
                    >
                      {suggestion}
                    </Link>
                  </Button>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </DocumentationSurface>
  )
}
