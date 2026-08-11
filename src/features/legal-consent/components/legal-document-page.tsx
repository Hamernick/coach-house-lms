import Link from "next/link"

import { PublicHeader } from "@/components/public/public-header"
import type { LegalDocument } from "../types"

export function LegalDocumentPage({ document }: { document: LegalDocument }) {
  return (
    <main className="bg-background text-foreground min-h-screen">
      <PublicHeader />
      <article className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8">
        <p className="text-muted-foreground text-sm">
          Product draft pending legal review · Version {document.version}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance">
          {document.title}
        </h1>
        <p className="text-muted-foreground mt-3 text-lg">
          {document.description}
        </p>
        <div className="mt-10 space-y-8">
          {document.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="scroll-mt-24 text-xl font-semibold">
                {section.heading}
              </h2>
              <p className="text-muted-foreground mt-2 leading-7">
                {section.body}
              </p>
            </section>
          ))}
        </div>
        <p className="text-muted-foreground mt-12 border-t pt-6 text-sm">
          Return to{" "}
          <Link
            href="/sign-up"
            className="text-foreground underline underline-offset-2"
          >
            account creation
          </Link>
          .
        </p>
      </article>
    </main>
  )
}
