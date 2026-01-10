import type { Metadata } from "next"
import Link from "next/link"

import { NewsGradientThumb } from "@/components/news/gradient-thumb"

export const metadata: Metadata = {
  title: "Funding roadmaps funders actually read",
  description: "A practical guide for turning strategy into a funding roadmap with outcomes, costs, and timing.",
}

export default function FundingRoadmapsPage() {
  return (
    <main className="min-h-screen bg-background">
      <article className="mx-auto w-[min(760px,92%)] pb-20 pt-24">
        <nav className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <span className="text-border">/</span>
          <Link href="/news" className="hover:text-foreground">
            News
          </Link>
        </nav>
        <section className="mb-10">
          <NewsGradientThumb
            seed="news-funding-roadmaps"
            className="aspect-[16/9] w-full rounded-3xl shadow-lg"
          />
        </section>
        <header className="space-y-3 border-b border-border/60 pb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Guide · Jan 2026
          </p>
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Funding roadmaps funders actually read
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            A funding roadmap is the bridge between vision and investment. This guide shows how to make it legible,
            credible, and easy for funders to follow.
          </p>
        </header>

        <div className="mt-8 space-y-10 text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">1. Start with outcomes, not activities</h2>
            <p>
              Funders invest in outcomes. Anchor the roadmap around the changes you expect to see, then list the
              activities that make those changes possible. This keeps the narrative clear and shows that your work is
              designed, not improvised.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">2. Show the funding logic</h2>
            <p>
              A roadmap should explain why funding at a specific point matters. Break the plan into phases and describe
              what each phase unlocks.
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Phase 1: Pilot and proof</li>
              <li>Phase 2: Stabilize delivery and staffing</li>
              <li>Phase 3: Scale with partners or new sites</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">3. Tie dollars to capacity</h2>
            <p>
              Funders want to know what changes when money lands. Tie each ask to staffing, systems, and delivery
              capacity so the request feels concrete. This also helps your team plan hires and vendor timelines.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">4. Make it legible at a glance</h2>
            <p>
              A one-page view is the goal: milestones, costs, and progress in a single frame. Lead with clarity, then
              give deeper detail in the appendix or support materials.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">5. Keep it living</h2>
            <p>
              A roadmap is only valuable if it stays current. Review it monthly, update assumptions, and highlight what
              has changed since the last share. Consistency builds trust.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Roadmap ingredients to include</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>Outcome milestones with timelines</li>
              <li>Program capacity targets</li>
              <li>Budget ranges by phase</li>
              <li>Clear asks and next steps</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Image & illustration placeholders</h2>
            <p>
              Use visuals to make the roadmap easy to scan: timelines, budget bands, and milestone snapshots. These
              placeholders mark where the graphics should land.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="aspect-[4/3] rounded-xl border border-dashed border-border/70 bg-muted/40" />
              <div className="aspect-[4/3] rounded-xl border border-dashed border-border/70 bg-muted/40" />
            </div>
          </section>
        </div>
      </article>
    </main>
  )
}
