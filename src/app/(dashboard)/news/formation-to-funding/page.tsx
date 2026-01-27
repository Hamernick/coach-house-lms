import type { Metadata } from "next"
import Link from "next/link"

import { NewsGradientThumb } from "@/components/news/gradient-thumb"

export const metadata: Metadata = {
  title: "From formation to funding",
  description: "A founder path that moves from incorporation and governance to funder readiness.",
}

export default function FormationToFundingPage() {
  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span className="text-border">/</span>
        <Link href="/news" className="hover:text-foreground">
          News
        </Link>
      </nav>

      <article className="mx-auto w-full max-w-[760px] space-y-8">
        <section>
          <NewsGradientThumb
            seed="news-formation-funding"
            className="aspect-[16/9] w-full rounded-3xl shadow-lg"
          />
        </section>
        <header className="space-y-3 border-b border-border/60 pb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Product · Jan 2026
          </p>
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            From formation to funding
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            A founder path that moves from incorporation and governance to a funder-ready plan that is easy to review.
          </p>
        </header>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">1. Formation is a system, not a checklist</h2>
            <p>
              Start with the basics: governance, compliance, and a clear ownership structure. The goal is stability, not
              perfection. A clean foundation makes everything else easier.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">2. Define the narrative spine</h2>
            <p>
              Your need statement, mission, and theory of change should read like a single story. When those pieces
              align, your roadmap and funding requests feel coherent.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">3. Design the pilot with constraints</h2>
            <p>
              A pilot is not a smaller version of the final program. It is a test. Specify who it serves, what it costs,
              and what success looks like in the short term.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">4. Build funder readiness assets</h2>
            <p>
              Funders need a clean packet: a concise summary, a clear budget, and a roadmap that shows timing and
              milestones. Keep the assets consistent and easy to share.
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>One-page program summary</li>
              <li>Phase-based budget</li>
              <li>Funding roadmap with asks</li>
              <li>Progress updates and outcomes</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">5. Operate with feedback loops</h2>
            <p>
              Funder readiness is ongoing. Track outcomes, refine the roadmap, and keep stakeholders in the loop so the
              story stays current as the organization grows.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Image & illustration placeholders</h2>
            <p>
              Use a timeline graphic, a checklist, and a simple funding flow to make the path easy to grasp at a glance.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="aspect-[4/3] rounded-xl border border-dashed border-border/70 bg-muted/40" />
              <div className="aspect-[4/3] rounded-xl border border-dashed border-border/70 bg-muted/40" />
            </div>
          </section>
        </div>
      </article>
    </div>
  )
}
