import Link from "next/link"

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-16 bg-gradient-to-b from-background via-background to-secondary/40 px-6 py-24 text-center">
      <div className="space-y-6">
        <span className="rounded-full border border-border bg-card px-4 py-1 text-sm text-muted-foreground">
          Coach House LMS
        </span>
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Ship courses faster with an opinionated learning platform
        </h1>
        <p className="mx-auto max-w-2xl text-balance text-muted-foreground">
          Launch an LMS with Supabase auth, Stripe billing, and production-ready
          dashboard components. Pricing stays simple as you add more cohorts.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/login"
            className="rounded-full bg-primary px-6 py-2 text-primary-foreground transition hover:bg-primary/90"
          >
            Sign in
          </Link>
          <Link
            href="/pricing"
            className="rounded-full border border-border px-6 py-2 text-sm font-medium text-foreground transition hover:bg-secondary"
          >
            View pricing
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full border border-border px-6 py-2 text-sm font-medium text-foreground transition hover:bg-secondary"
          >
            View dashboard sample
          </Link>
        </div>
      </div>
      <div className="grid w-full max-w-3xl gap-6 rounded-3xl border border-border bg-card/80 p-8 backdrop-blur">
        <p className="text-left text-muted-foreground">
          ✓ Public marketing shell
        </p>
        <p className="text-left text-muted-foreground">
          ✓ Authentication routes staged
        </p>
        <p className="text-left text-muted-foreground">
          ✓ Dashboard + pricing experiences ready for real data
        </p>
      </div>
    </main>
  )
}
