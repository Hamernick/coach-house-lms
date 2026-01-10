import type { Metadata } from "next"
import Link from "next/link"

import { NewsGradientThumb } from "@/components/news/gradient-thumb"

export const metadata: Metadata = {
  title: "Discovery tools for grassroots organizations",
  description: "How to make your work easier to find, trust, and support across your community.",
}

export default function GrassrootsDiscoveryPage() {
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
            seed="news-grassroots-discovery"
            className="aspect-[16/9] w-full rounded-3xl shadow-lg"
          />
        </section>
        <header className="space-y-3 border-b border-border/60 pb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Community · Jan 2026
          </p>
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Discovery tools for grassroots organizations
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Make it easier for partners, funders, and supporters to find your work and understand why it matters.
          </p>
        </header>

        <div className="mt-8 space-y-10 text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">1. Visibility starts with clarity</h2>
            <p>
              Discovery is less about marketing and more about clarity. A concise profile, clear focus areas, and a
              defined service region make it easier for others to connect you to the right opportunity.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">2. Signal where you work and who you serve</h2>
            <p>
              Grassroots organizations often rely on local trust. Share your geography, audience, and program focus so
              partners can quickly see alignment.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">3. Open doors for partners</h2>
            <p>
              Discovery should help you find collaborators, not just donors. Share partnership needs, volunteer roles,
              and referral pathways so community organizations know how to engage.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">4. Trust compounds with updates</h2>
            <p>
              When supporters see consistent updates on progress, they become repeat advocates. Publish a lightweight
              update cadence with milestones, outcomes, and next steps.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">5. Design discovery as a system</h2>
            <p>
              The goal is to make discovery repeatable: a profile, a roadmap, and a shareable narrative. Build once,
              then update as you grow.
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Clear org profile and service focus</li>
              <li>Program summaries tied to outcomes</li>
              <li>Funding roadmap and partnership asks</li>
              <li>Community updates and progress signals</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Image & illustration placeholders</h2>
            <p>
              Use map visuals, profile snapshots, and partnership cards to make the discovery journey tangible.
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
