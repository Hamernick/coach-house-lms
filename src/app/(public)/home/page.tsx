import type { Metadata } from "next"
import Link from "next/link"
import { Fraunces } from "next/font/google"

import Sparkles from "lucide-react/dist/esm/icons/sparkles"
import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right"
import Layers from "lucide-react/dist/esm/icons/layers"
import Compass from "lucide-react/dist/esm/icons/compass"
import CalendarCheck from "lucide-react/dist/esm/icons/calendar-check"

import { PublicHeader } from "@/components/public/public-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-display",
})

export const metadata: Metadata = {
  title: "Home",
  description: "Prototype home page inspired by Molly Studio.",
}

export const runtime = "edge"
export const revalidate = 86400

const SIGNALS = [
  { label: "Nonprofit formation", value: "501(c)(3) + EIN" },
  { label: "Strategic roadmap", value: "Publishable by default" },
  { label: "Program planning", value: "From idea to launch" },
]

const STUDIO_BLOCKS = [
  {
    title: "The launch track",
    body: "A guided path that combines formation, planning, and the assets funders expect to see.",
    icon: Compass,
  },
  {
    title: "Roadmap as a living artifact",
    body: "Your answers compile into a shareable narrative with milestones, initiatives, and progress.",
    icon: Layers,
  },
  {
    title: "Coaching rhythm built in",
    body: "Weekly prompts plus coaching sessions keep your leadership team aligned and moving.",
    icon: CalendarCheck,
  },
]

const PROCESS = [
  {
    step: "01",
    title: "Shape the story",
    body: "Clarify the mission, original need, and theory of change with guided prompts.",
  },
  {
    step: "02",
    title: "Design the roadmap",
    body: "Translate strategy into initiatives, timing, and measurable outcomes.",
  },
  {
    step: "03",
    title: "Launch with confidence",
    body: "Publish your org profile, program plan, and roadmap when you're ready.",
  },
]

export default function HomePage() {
  return (
    <main
      className={cn(
        "relative min-h-screen overflow-hidden bg-background text-foreground",
        "dark:[--home-accent:oklch(0.64_0.08_70)] dark:[--home-accent-2:oklch(0.62_0.12_200)]",
        "[--home-accent:oklch(0.9_0.09_80)] [--home-accent-2:oklch(0.78_0.12_200)]",
      )}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 right-[-8%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_top,var(--home-accent)_0%,transparent_70%)] opacity-60 blur-3xl" />
        <div className="absolute -bottom-40 left-[-10%] h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle_at_bottom,var(--home-accent-2)_0%,transparent_70%)] opacity-45 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,color-mix(in_srgb,var(--home-accent)_14%,transparent)_100%)] opacity-40" />
      </div>

      <PublicHeader />

      <div className="relative mx-auto flex w-[min(1200px,92%)] flex-col gap-20 pb-24 pt-28">
        <section className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              Prototype home experience
            </div>
            <h1 className={cn(display.className, "text-balance text-5xl font-semibold tracking-tight sm:text-6xl")}>
              Build a nonprofit launch plan that looks as good as it reads.
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Coach House combines formation guidance, accelerator content, and a shareable roadmap so your team can move from
              idea to funder-ready faster.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="rounded-full px-6">
                <Link href="/pricing">
                  View pricing <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-6">
                <Link href="/sign-up">Start free</Link>
              </Button>
            </div>
            <div className="grid gap-4 pt-4 sm:grid-cols-3">
              {SIGNALS.map((signal, index) => (
                <div
                  key={signal.label}
                  className="rounded-2xl border border-border/60 bg-card/60 px-4 py-3 animate-in fade-in slide-in-from-bottom-4 duration-700"
                  style={{ animationDelay: `${120 + index * 80}ms` }}
                >
                  <p className="text-xs uppercase text-muted-foreground">{signal.label}</p>
                  <p className="mt-2 text-sm font-semibold">{signal.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150">
            <Card className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/70 p-6 shadow-lg">
              <div className="flex items-center justify-between text-xs uppercase text-muted-foreground">
                Platform Board
                <Badge variant="secondary" className="rounded-full">Draft</Badge>
              </div>
              <p className={cn(display.className, "mt-6 text-2xl font-semibold")}>
                Roadmap, programs, and funding signals in one view.
              </p>
              <div className="mt-6 grid gap-3">
                {["Community need", "Theory of change", "Pilot timeline"].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Sparkles className="h-4 w-4" aria-hidden />
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="rounded-3xl border border-border/60 bg-card/70 p-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <p className="text-xs uppercase text-muted-foreground">Program</p>
                <p className="mt-3 text-lg font-semibold">Neighborhood Impact Lab</p>
                <p className="mt-2 text-sm text-muted-foreground">Launch curriculum, staffing, and budgeting in one sprint.</p>
              </Card>
              <Card className="rounded-3xl border border-border/60 bg-card/70 p-5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                <p className="text-xs uppercase text-muted-foreground">Public page</p>
                <p className="mt-3 text-lg font-semibold">Ready to share</p>
                <p className="mt-2 text-sm text-muted-foreground">Publish the profile when your board approves.</p>
              </Card>
            </div>
          </div>
        </section>

        <section className="grid gap-10 lg:grid-cols-[0.6fr_1fr] lg:items-start">
          <div className="space-y-4">
            <p className="text-xs uppercase text-muted-foreground">Everything in one place</p>
            <h2 className={cn(display.className, "text-3xl font-semibold")}>
              A strategic home for every nonprofit decision.
            </h2>
            <p className="text-sm text-muted-foreground">
              Use the platform as a living strategy board. Every entry becomes part of your published story.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {STUDIO_BLOCKS.map((block, index) => (
              <Card
                key={block.title}
                className="rounded-3xl border border-border/60 bg-card/70 p-5 animate-in fade-in slide-in-from-bottom-4 duration-700"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <block.icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-4 text-base font-semibold">{block.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{block.body}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div className="rounded-3xl border border-border/60 bg-card/70 p-6">
            <div className="flex items-center justify-between text-xs uppercase text-muted-foreground">
              Process
              <span>3 steps</span>
            </div>
            <Separator className="my-4" />
            <div className="space-y-4">
              {PROCESS.map((step) => (
                <div key={step.step} className="flex gap-4">
                  <div className="text-xs font-semibold text-muted-foreground">{step.step}</div>
                  <div>
                    <p className="text-sm font-semibold">{step.title}</p>
                    <p className="text-sm text-muted-foreground">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border/60 bg-foreground p-6 text-background shadow-xl">
            <p className="text-xs uppercase text-background/70">Platform note</p>
            <h2 className={cn(display.className, "mt-4 text-3xl font-semibold")}>
              Make it easy for funders to say yes.
            </h2>
            <p className="mt-4 text-sm text-background/80">
              The platform keeps your mission, plan, and proof in sync. That means fewer follow-up emails and a clearer narrative
              when it matters most.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-6 rounded-full px-6">
              <Link href="/pricing">Explore tiers</Link>
            </Button>
          </div>
        </section>

        <section className="rounded-3xl border border-border/60 bg-card/70 p-8 text-center">
          <p className="text-xs uppercase text-muted-foreground">Get started</p>
          <h2 className={cn(display.className, "mt-3 text-3xl font-semibold")}>Ready to build the first draft?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
            Start with the free platform tools, then upgrade when you want accelerator guidance or long-term community support.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-full px-6">
              <Link href="/sign-up">Start free</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-6">
              <Link href="/pricing">View pricing</Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  )
}
