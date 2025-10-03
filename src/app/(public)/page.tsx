import Link from "next/link"

export default function LandingPage() {
  return (
    <main className="relative min-h-screen bg-gradient-to-b from-background via-background to-secondary/40">
      {/* Floating glass header */}
      <header className="sticky top-4 z-50 mx-auto w-[min(1100px,92%)] rounded-2xl border border-border/70 bg-background/50 px-4 py-3 shadow-md backdrop-blur supports-[backdrop-filter]:bg-background/40">
        <nav className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-md bg-primary/10" aria-hidden />
            <span className="text-sm font-semibold tracking-tight">Coach House</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Link href="#benefits" className="hidden sm:inline hover:text-foreground">Benefits</Link>
            <Link href="#how" className="hidden sm:inline hover:text-foreground">How it works</Link>
            <Link href="/pricing" className="hidden sm:inline hover:text-foreground">Pricing</Link>
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
              <span className="size-1 rounded-full bg-emerald-500" /> 1200+ active users
            </div>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              Launch and run your courses without the busywork
            </h1>
            <p className="max-w-xl text-balance text-muted-foreground">
              Coach House LMS handles auth, billing, content, and progress tracking so you can focus on teaching—not integrations.
            </p>
            <div className="flex flex-wrap items-center gap-3 md:justify-start md:gap-4">
              <Link
                href="/pricing"
                className="rounded-full bg-primary px-6 py-2 text-primary-foreground transition hover:bg-primary/90"
              >
                Start a free trial
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-border px-6 py-2 text-sm font-medium text-foreground transition hover:bg-secondary"
              >
                Sign in to your account
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">No setup fees. Cancel anytime.</p>
          </div>
          <div className="flex-1">
            <div className="aspect-video w-full rounded-2xl border border-border bg-card/60 shadow-sm" aria-hidden />
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
        <h2 className="text-center text-2xl font-semibold">Benefits</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-muted-foreground">
          Help learners progress with sequential modules, built‑in assignments, and real‑time progress tracking.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Faster time to launch",
              body: "Go live in days—not months—with auth, billing, and content already wired.",
            },
            {
              title: "Built for teaching",
              body: "Modules, assignments, and progress states keep learners engaged and on track.",
            },
            {
              title: "Simple billing",
              body: "Stripe subscriptions with a customer portal—no custom invoices required.",
            },
            {
              title: "Admin control",
              body: "Create and reorder modules, manage users, and review submissions in one place.",
            },
            {
              title: "Secure by default",
              body: "Row‑level security, signed URLs for private files, and verified webhooks.",
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
          Get started in three simple steps.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              step: "1",
              title: "Create your class",
              body: "Add modules, upload a deck, and publish when you’re ready.",
            },
            {
              step: "2",
              title: "Invite learners",
              body: "Enroll by email or send invites—billing handled by Stripe.",
            },
            {
              step: "3",
              title: "Track progress",
              body: "Review submissions, leave feedback, and see completion at a glance.",
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
          <h2 className="text-2xl font-semibold">Ready to teach with less setup?</h2>
          <p className="mt-2 text-muted-foreground">Spin up your course in minutes and invite your first learners today.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/pricing" className="rounded-full bg-primary px-6 py-2 text-primary-foreground hover:bg-primary/90">
              Start free trial
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
            <span>Coach House LMS</span>
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
