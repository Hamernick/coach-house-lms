import Link from "next/link"
import Image from "next/image"

import { NewsGradientThumb } from "@/components/news/gradient-thumb"

export const runtime = "edge"
export const revalidate = 86400

export default function LandingPage() {
  return (
    <main className="relative min-h-screen bg-gradient-to-b from-background via-background to-secondary/40">
      {/* Floating glass header */}
      <header className="sticky top-4 z-50 mx-auto w-[min(1100px,92%)] rounded-2xl border border-border/70 bg-background/50 px-4 py-3 shadow-md backdrop-blur supports-[backdrop-filter]:bg-background/40">
        <nav className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-8 w-8 items-center justify-center">
              <Image
                src="/coach-house-logo-light.png"
                alt="Coach House logo"
                width={32}
                height={32}
                className="block dark:hidden"
                priority
              />
              <Image
                src="/coach-house-logo-dark.png"
                alt="Coach House logo"
                width={32}
                height={32}
                className="hidden dark:block"
                priority
              />
            </span>
            <span className="text-sm font-semibold tracking-tight">Coach House</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Link href="#benefits" className="hidden sm:inline hover:text-foreground">Benefits</Link>
            <Link href="#how" className="hidden sm:inline hover:text-foreground">How it works</Link>
            <Link href="/pricing" className="hidden sm:inline hover:text-foreground">Pricing</Link>
            <Link href="/news" className="hidden sm:inline hover:text-foreground">News</Link>
            <Link
              href="/login"
              className="rounded-full bg-primary px-4 py-2 font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              Sign in
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto w-[min(1100px,92%)] px-1 pt-28">
        <div className="flex flex-col items-center gap-8 text-center md:flex-row md:items-start md:text-left">
          <div className="flex-1 space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs text-muted-foreground">
              <span className="size-1 rounded-full bg-emerald-500" /> For nonprofits turning ideas into impact
            </div>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              Turn strategy into a clear, shareable roadmap
            </h1>
            <p className="max-w-xl text-balance text-muted-foreground">
              Coach House guides you through a proven accelerator path and turns your work into an organization profile, programs,
              and a strategic roadmap you can publish for stakeholders.
            </p>
            <div className="flex flex-wrap items-center gap-3 md:justify-start md:gap-4">
              <Link
                href="/pricing"
                className="rounded-full bg-primary px-6 py-2 text-primary-foreground transition hover:bg-primary/90"
              >
                View plans
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-border px-6 py-2 text-sm font-medium text-foreground transition hover:bg-secondary"
              >
                Sign in
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">
              Mission, theory of change, pilots, budgets, and more—captured once and reused across your roadmap and public page.
            </p>
          </div>
          <div className="flex-1">
            <NewsGradientThumb
              seed="hero-my-organization"
              className="aspect-video w-full rounded-2xl border border-border shadow-sm"
            />
          </div>
        </div>
      </section>

      {/* Partners / Social proof */}
      <section className="mx-auto mt-16 w-[min(1100px,92%)]">
        <p className="mb-4 text-center text-xs text-muted-foreground">Trusted by teams and educators at</p>
        <div className="flex flex-wrap items-center justify-center gap-6 opacity-80">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-6 w-24 rounded bg-foreground/10" aria-hidden />
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="mx-auto mt-20 w-[min(1100px,92%)]">
        <h2 className="text-center text-2xl font-semibold">What it does</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-muted-foreground">
          A guided workflow that turns your thinking into assets your team can use immediately.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Roadmap, automatically compiled",
              body: "Your module answers become a strategic roadmap you can publish and share with funders and stakeholders.",
            },
            {
              title: "One source of truth",
              body: "Keep your organization profile, programs, and key decisions in one place—no more scattered docs.",
            },
            {
              title: "Momentum built in",
              body: "Sequential modules, next-up navigation, and progress tracking keep you moving without guesswork.",
            },
            {
              title: "Public sharing (optional)",
              body: "Publish a clean public page and roadmap when you’re ready—and keep everything private by default.",
            },
            {
              title: "People + org chart",
              body: "Capture staff, board, and supporters to build an org chart and clarify accountability.",
            },
            {
              title: "Accessible & fast",
              body: "Responsive UI, keyboard friendly, and optimized for quick first loads.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-border bg-card/60 p-5">
              <h3 className="text-base font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto mt-20 w-[min(1100px,92%)]">
        <h2 className="text-center text-2xl font-semibold">How it works</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-muted-foreground">
          Three steps. One clear plan.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              step: "1",
              title: "Start with a baseline",
              body: "Set up your organization and pick up the next module in your accelerator path.",
            },
            {
              step: "2",
              title: "Work through modules",
              body: "Answer guided prompts, submit work, and iterate with feedback as you progress.",
            },
            {
              step: "3",
              title: "Publish when ready",
              body: "Share a clean public roadmap and org page, or keep everything private while you refine.",
            },
          ].map((item) => (
            <div key={item.step} className="rounded-xl border border-border bg-card/60 p-5">
              <div className="mb-2 inline-flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {item.step}
              </div>
              <h3 className="text-base font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing preview */}
      <section className="mx-auto mt-20 w-[min(1100px,92%)]">
        <div className="rounded-2xl border border-border bg-card/50 p-6 text-center">
          <h2 className="text-2xl font-semibold">Simple pricing</h2>
          <p className="mt-2 text-muted-foreground">Start today. Scale as you grow.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/pricing" className="rounded-full bg-primary px-6 py-2 text-primary-foreground hover:bg-primary/90">
              View plans
            </Link>
            <Link href="/login" className="rounded-full border border-border px-6 py-2 text-sm hover:bg-secondary">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto mt-20 w-[min(900px,92%)]">
        <h2 className="text-center text-2xl font-semibold">Frequently asked questions</h2>
        <div className="mt-6 space-y-3">
          {[
            {
              q: "Can I use my own Stripe account?",
              a: "Yes. Connect your test keys to try the flow, then upgrade to live keys when you’re ready.",
            },
            {
              q: "Can I bring existing learners?",
              a: "Absolutely. Enroll by email or invite with a token—no forced signup flow.",
            },
            {
              q: "Is my content private?",
              a: "Decks use signed URLs and are never public. Data is protected by row‑level security.",
            },
            {
              q: "Can I cancel anytime?",
              a: "Yes—your plan is month‑to‑month. Access to the portal persists for invoices and receipts.",
            },
          ].map((item) => (
            <details key={item.q} className="rounded-xl border border-border bg-card/50 p-4">
              <summary className="cursor-pointer text-sm font-medium">{item.q}</summary>
              <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA + Footer */}
      <section className="mx-auto mt-20 w-[min(1100px,92%)]">
        <div className="rounded-2xl border border-border bg-primary/10 p-8 text-center">
          <h2 className="text-2xl font-semibold">Ready to turn strategy into momentum?</h2>
          <p className="mt-2 text-muted-foreground">Build a roadmap you can share—and keep your organization’s plan in sync as you grow.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/pricing" className="rounded-full bg-primary px-6 py-2 text-primary-foreground hover:bg-primary/90">
              View plans
            </Link>
            <Link href="/login" className="rounded-full border border-border px-6 py-2 text-sm hover:bg-secondary">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto mt-16 w-[min(1100px,92%)] border-t border-border/60 py-10 text-sm text-muted-foreground">
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-primary/10" aria-hidden />
            <span>Coach House</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
            <a href={`mailto:contact@coachhousesolutions.org`} className="hover:text-foreground">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}
