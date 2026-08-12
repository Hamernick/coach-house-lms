import Link from "next/link"

import { PublicHeader } from "@/components/public/public-header"
import type { LegalDocument } from "../types"

export function LegalDocumentPage({ document }: { document: LegalDocument }) {
  const relatedDocument =
    document.slug === "terms"
      ? { href: "/privacy", label: "Privacy Policy" }
      : { href: "/terms", label: "Terms of Service" }

  return (
    <main
      id="main-content"
      className="bg-background text-foreground min-h-screen"
    >
      <PublicHeader />
      <article className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="text-muted-foreground text-sm">
          Effective {document.effectiveDate} · Version {document.version}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance">
          {document.title}
        </h1>
        <p className="text-muted-foreground mt-3 text-lg">
          {document.description}
        </p>
        <nav
          aria-label={`${document.title} sections`}
          className="bg-muted/40 border-border/70 mt-10 rounded-xl border p-5"
        >
          <h2 className="text-sm font-semibold">On this page</h2>
          <ol className="text-muted-foreground mt-3 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
            {document.sections.map((section, index) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="hover:text-foreground focus-visible:ring-ring inline-flex min-h-6 rounded-sm underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
                >
                  {index + 1}. {section.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="mt-12 space-y-10">
          {document.sections.map((section) => (
            <section key={section.id} aria-labelledby={section.id}>
              <h2
                id={section.id}
                className="scroll-mt-24 text-xl font-semibold text-balance"
              >
                {section.heading}
              </h2>
              <div className="text-muted-foreground mt-3 space-y-3 leading-7">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.items?.length ? (
                  <ul className="list-disc space-y-2 pl-6">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </section>
          ))}
        </div>
        <div className="text-muted-foreground mt-12 flex flex-wrap gap-x-6 gap-y-3 border-t pt-6 text-sm">
          <Link
            href="/sign-up"
            className="text-foreground focus-visible:ring-ring rounded-sm underline underline-offset-4 focus-visible:ring-2 focus-visible:outline-none"
          >
            Return to account creation
          </Link>
          <Link
            href={relatedDocument.href}
            className="text-foreground focus-visible:ring-ring rounded-sm underline underline-offset-4 focus-visible:ring-2 focus-visible:outline-none"
          >
            Read the {relatedDocument.label}
          </Link>
        </div>
      </article>
    </main>
  )
}
