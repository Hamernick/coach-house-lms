import type { Metadata } from "next"
import Link from "next/link"

import { NewsGradientThumb } from "@/components/news/gradient-thumb"
import { AIQualityChart, AIUsageChart } from "./charts"

export const metadata: Metadata = {
  title: "How we think about AI",
  description: "A minimalist essay on models, math at scale, and human objectives.",
}

export default function HowWeThinkAboutAIPage() {
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
            seed="featured-how-we-think-about-ai"
            className="aspect-[16/9] w-full rounded-3xl shadow-lg"
          />
        </section>
        <header className="space-y-3 border-b border-border/60 pb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Tools · October 2025
          </p>
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            How we think about AI
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            AI is not magic. It&apos;s math at scale, applied to human objectives. This post outlines how we think about
            models, constraints, and guardrails when we build tools for nonprofits and learning teams.
          </p>
        </header>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">1. Models as pattern amplifiers</h2>
            <p>
              Modern language models are pattern amplifiers. Given enough examples, they learn to predict the next token
              with surprising accuracy. At small scale this looks like autocomplete. At large scale, the same math can
              help teams triage hundreds of applications, synthesize feedback, or draft lesson plans.
            </p>
            <p>
              The key is that the underlying mechanism is simple: optimize a loss function over billions of
              examples. The complexity comes from scale, data, and how we translate real‑world goals into an objective
              the model can optimize.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-base font-semibold text-foreground">2. Scale changes the shape of work</h2>
            <p>
              A helpful way to reason about AI is to anchor on orders of magnitude. When a team moves from answering ten
              questions a week to thousands, the bottleneck is no longer individual craft. It&apos;s designing systems
              that stay legible as volume grows.
            </p>
            <AIUsageChart />
            <p>
              Even in this toy example, each step up is just a multiplier on the same underlying process. The magic is
              not that the model &quot;understands&quot; everything. It&apos;s that we can reliably apply the same
              operation to thousands of similar tasks with consistent latency and cost.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-base font-semibold text-foreground">3. Quality comes from loops, not prompts</h2>
            <p>
              Prompt engineering matters, but feedback loops matter more. In practice, the teams that get the most value
              from AI are the ones who close the loop between real outcomes and model behavior: they review outputs,
              label edge cases, and bake that learning back into the system.
            </p>
            <AIQualityChart />
            <p>
              The point isn&apos;t that one approach is universally better. It&apos;s that the same underlying math can
              be pointed at different objectives: accuracy, speed, personalization. Clarity about the objective is what
              makes model behavior legible.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">4. Guardrails are part of the product</h2>
            <p>
              For nonprofits and learning teams, the cost of a bad outcome can be high. That&apos;s why we treat
              guardrails—rate limits, validation, approvals, and audit trails—as first‑class product features, not
              afterthoughts.
            </p>
            <p>
              The math stays the same; we simply constrain where and how it can be applied. We prefer systems that are
              slightly conservative but predictable over ones that are clever but brittle.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">5. A mental model to keep</h2>
            <p>
              When in doubt, we fall back to a simple framing: models are fast, stochastic calculators. They can
              compress patterns and surface options, but humans still define the objective, review the trade‑offs, and
              decide what &quot;good&quot; looks like.
            </p>
            <p>
              Designing with AI is less about clever prompts and more about choosing the right interfaces, loops, and
              guardrails so the math works in service of the people using it.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Image & illustration placeholders</h2>
            <p>
              Here&apos;s where we&apos;d drop in diagrams or photos to explain concepts—model pipelines, before/after
              workflows, or a snapshot of a real organization using these tools. For now, treat them as anchors for
              future visuals.
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
