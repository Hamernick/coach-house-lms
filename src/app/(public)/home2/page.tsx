import type { Metadata } from "next"
import Link from "next/link"
import { Sora, Space_Grotesk } from "next/font/google"

import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right"
import CalendarCheck from "lucide-react/dist/esm/icons/calendar-check"
import Compass from "lucide-react/dist/esm/icons/compass"
import Layers from "lucide-react/dist/esm/icons/layers"

import { Home2PhotoStrip } from "@/components/public/home2-photo-strip"
import { Home2ScrollVideo } from "@/components/public/home2-scroll-video"
import { PublicHeader } from "@/components/public/public-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const heading = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-heading",
})

const body = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
})

export const metadata: Metadata = {
  title: "Home Two",
  description: "Alternate home page prototype inspired by Molly Studio.",
}

export const runtime = "edge"
export const revalidate = 86400

const STUDIO_BLOCKS = [
  {
    title: "The launch studio",
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

const PROCESS_STEPS = [
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

const NEWS_FEATURES = [
  {
    href: "/news/how-we-think-about-AI",
    eyebrow: "Product · Oct 2025",
    title: "Introducing accelerator safeguards",
    description: "The guardrails we built so students can move fast without losing progress.",
  },
  {
    href: "/news/how-we-think-about-AI",
    eyebrow: "Story · Sep 2025",
    title: "How we think about AI for nonprofits",
    description: "AI is math at scale pointed at fundraising, storytelling, and stewardship.",
  },
]

const LIBRARY = [
  {
    href: "/news/how-we-think-about-AI",
    eyebrow: "Product · Oct 21, 2025",
    title: "How we think about and approach AI for nonprofits",
    subtitle: "A framework for using AI without losing the human story.",
  },
  {
    href: "/news/how-we-think-about-AI",
    eyebrow: "Product · Oct 2025",
    title: "Introducing accelerator safeguards",
    subtitle: "Protect progress, keep students moving, and stay audit-ready.",
  },
  {
    href: "/news/how-we-think-about-AI",
    eyebrow: "Story · Sep 2025",
    title: "Sora 2 is here",
    subtitle: "What generative media means for nonprofit storytelling.",
  },
  {
    href: "/news/how-we-think-about-AI",
    eyebrow: "Story · Sep 2025",
    title: "Building the roadmap with the board",
    subtitle: "How we structure planning so funders can follow along.",
  },
]

const PHOTO_STRIP = [
  { id: "photo-1", label: "Studio gathering", className: "h-60 w-[var(--first-card)] sm:h-64 lg:h-72" },
  { id: "photo-2", label: "Demo night", className: "h-48 w-48 sm:h-52 sm:w-52 lg:h-56 lg:w-56" },
  { id: "photo-3", label: "Team work", className: "h-56 w-64 sm:h-60 sm:w-72 lg:h-64 lg:w-80" },
  { id: "photo-4", label: "Workshop", className: "h-44 w-44 sm:h-48 sm:w-48 lg:h-52 lg:w-52" },
  { id: "photo-5", label: "Community night", className: "h-64 w-72 sm:h-72 sm:w-[28rem]" },
  { id: "photo-6", label: "Founder talk", className: "h-44 w-44 sm:h-48 sm:w-48 lg:h-52 lg:w-52" },
  { id: "photo-7", label: "Brainstorm", className: "h-56 w-64 sm:h-60 sm:w-72 lg:h-64 lg:w-80" },
  { id: "photo-8", label: "Celebration", className: "h-52 w-56 sm:h-56 sm:w-64 lg:h-60 lg:w-72" },
]

export default function HomeTwoPage() {
  return (
    <main
      className={cn(
        body.className,
        "relative min-h-screen overflow-hidden bg-background text-foreground",
        "dark:bg-[#0f0f12]",
      )}
    >
      <PublicHeader />

      <div className="mx-auto flex w-[min(1240px,92%)] flex-col gap-32 pb-32 pt-32">
        <section className="grid min-h-[70vh] place-items-center text-center">
          <div className="space-y-6">
            <div className="inline-flex items-center justify-center gap-2 rounded-full border border-border/60 bg-card/70 px-4 py-2 text-xs text-muted-foreground shadow-sm animate-fade-in">
              <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
              Coach House public prototype
            </div>
            <h1 className={cn(heading.className, "text-balance text-4xl font-semibold sm:text-5xl lg:text-6xl animate-soft-pop")}>
              Coach House has opened the nonprofit studio.
            </h1>
            <p className="mx-auto max-w-2xl text-base text-muted-foreground animate-fade-up">
              A formation and planning platform for leaders who need their roadmap to look as good as it reads.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button asChild size="lg" className="rounded-full px-6">
                <Link href="/pricing">
                  View pricing <ArrowUpRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-6">
                <Link href="/sign-up">Start free</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="space-y-10">
          <Home2ScrollVideo className="animate-fade-in" />
        </section>

        <section className="flex justify-center">
          <Card className="relative w-full max-w-5xl overflow-hidden rounded-[40px] border border-border/70 bg-[linear-gradient(135deg,#f6c7ef_0%,#f3b0df_45%,#f0a2d6_100%)] shadow-xl dark:border-white/10 dark:bg-[linear-gradient(135deg,#5b2b4b_0%,#472238_55%,#341a29_100%)] aspect-[16/9]" />
        </section>

        <section className="grid gap-12 md:grid-cols-2">
          {NEWS_FEATURES.map((item) => (
            <Link key={item.title} href={item.href} className="group space-y-5">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] border border-border/60 bg-muted/40 shadow-lg transition-transform duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-xl" />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs uppercase text-muted-foreground">{item.eyebrow}</p>
                  <p className="text-base font-semibold">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" aria-hidden />
              </div>
            </Link>
          ))}
        </section>

        <section className="grid gap-10 lg:grid-cols-[0.6fr_1fr] lg:items-start">
          <div className="space-y-4">
            <p className="text-xs uppercase text-muted-foreground">Studio style</p>
            <h2 className={cn(heading.className, "text-3xl font-semibold")}>
              A strategic home for every nonprofit decision.
            </h2>
            <p className="text-sm text-muted-foreground">
              Use the platform as a living studio board. Every entry becomes part of your published story.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {STUDIO_BLOCKS.map((block, index) => (
              <Card
                key={block.title}
                className="rounded-[28px] border border-border/60 bg-card/70 p-5 shadow-sm transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-md animate-fade-up"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <block.icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-4 text-base font-semibold">{block.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{block.body}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div className="rounded-[32px] border border-border/60 bg-card/70 p-6">
            <div className="flex items-center justify-between text-xs uppercase text-muted-foreground">
              Process
              <span>3 steps</span>
            </div>
            <div className="mt-5 space-y-5">
              {PROCESS_STEPS.map((step) => (
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

          <div className="rounded-[32px] border border-border/60 bg-foreground p-6 text-background shadow-xl">
            <p className="text-xs uppercase text-background/70">Studio note</p>
            <h2 className={cn(heading.className, "mt-4 text-3xl font-semibold")}>
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

        <section className="flex justify-center">
          <div className="max-w-2xl text-center text-base text-muted-foreground">
            We have partnered with more than 28 organizations and built a deep library of frameworks for nonprofit strategy,
            storytelling, and fundraising. We share unpolished demos so teams can move faster together.
          </div>
        </section>

        <section className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {LIBRARY.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group flex min-h-[360px] flex-col rounded-[26px] bg-card/70 p-4 shadow-sm transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-md"
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[22px] bg-muted/40">
                <span className="absolute bottom-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-muted-foreground shadow-sm transition group-hover:bg-background">
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </span>
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-[11px] uppercase text-muted-foreground">{item.eyebrow}</p>
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.subtitle}</p>
              </div>
            </Link>
          ))}
        </section>

        <section className="flex flex-col gap-10">
          <Home2PhotoStrip items={PHOTO_STRIP} />
        </section>

        <section className="rounded-[32px] border border-border/60 bg-card/70 p-10 text-center">
          <p className="text-sm text-muted-foreground">Ready to begin?</p>
          <h2 className={cn(heading.className, "mt-4 text-3xl font-semibold")}>
            Build the first draft of your nonprofit plan.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
            Start with the free platform, then upgrade when you want accelerator guidance or ongoing coaching.
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
