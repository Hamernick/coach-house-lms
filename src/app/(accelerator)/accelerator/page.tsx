import Link from "next/link"

import Activity from "lucide-react/dist/esm/icons/activity"
import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right"
import BarChart3 from "lucide-react/dist/esm/icons/bar-chart-3"
import Building2 from "lucide-react/dist/esm/icons/building-2"
import Calendar from "lucide-react/dist/esm/icons/calendar"
import ClipboardList from "lucide-react/dist/esm/icons/clipboard-list"
import HelpCircle from "lucide-react/dist/esm/icons/help-circle"
import Library from "lucide-react/dist/esm/icons/library"
import Map from "lucide-react/dist/esm/icons/map"
import Sparkles from "lucide-react/dist/esm/icons/sparkles"
import Users from "lucide-react/dist/esm/icons/users"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Empty } from "@/components/ui/empty"
import { ProgramCard } from "@/components/programs/program-card"
import { AcceleratorScheduleCard } from "@/components/accelerator/accelerator-schedule-card"
import { ProgramWizardLazy } from "@/components/programs/program-wizard-lazy"

export const runtime = "edge"
export const dynamic = "force-dynamic"

const PROGRAM_TEMPLATES = [
  {
    title: "After-school STEM Lab",
    location: "Youth enrichment",
    chips: ["12-week cohort", "STEM mentors", "Pilot ready"],
    patternId: "template-stem",
  },
  {
    title: "Community Health Navigation",
    location: "Public health",
    chips: ["Case management", "Referral network", "Outcomes plan"],
    patternId: "template-health",
  },
]

const START_BUILDING = [
  {
    title: "Org profile",
    description: "Publish mission, basics, and board governance.",
    icon: Building2,
  },
  {
    title: "Program builder",
    description: "Scope outcomes, staffing, and fundraising goals.",
    icon: ClipboardList,
  },
  {
    title: "Strategic roadmap",
    description: "Set milestones, timelines, and evidence trails.",
    icon: Map,
  },
  {
    title: "Funding readiness",
    description: "Budget draft, compliance, and pilot plan.",
    icon: BarChart3,
  },
  {
    title: "People + org chart",
    description: "Clarify roles, accountability, and governance.",
    icon: Users,
  },
  {
    title: "Story + impact",
    description: "Capture narrative, proof points, and outcomes.",
    icon: Sparkles,
  },
]

const SUPPORT_LINKS = [
  {
    title: "Help center",
    description: "Setup guides and FAQs.",
    href: "/news",
    icon: HelpCircle,
  },
  {
    title: "Community calls",
    description: "Weekly office hours and peer support.",
    href: "/community",
    icon: Calendar,
  },
  {
    title: "Documentation",
    description: "Templates, playbooks, and electives.",
    href: "https://coach-house.gitbook.io/coach-house",
    icon: Library,
  },
  {
    title: "System status",
    description: "Platform health and release updates.",
    href: "/status",
    icon: Activity,
  },
]

export default function AcceleratorOverviewPage() {
  return (
    <div className="space-y-14">
      <section id="overview" className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="min-w-0 space-y-6 animate-fade-up">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Accelerator overview</p>
            <h1 className="text-balance text-3xl font-semibold text-foreground sm:text-4xl">
              Accelerator Progression
            </h1>
            <p className="text-sm text-muted-foreground">
              Build a sustainable nonprofit with a guided control center that turns every step into a publishable plan.
            </p>
            <div className="max-w-sm space-y-2">
              <div className="flex items-center justify-between text-xs uppercase text-muted-foreground">
                <span>Completion</span>
                <span className="text-foreground">42%</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-2 w-[42%] rounded-full bg-foreground/70" />
              </div>
            </div>
          </div>
          <Card className="border-border/60 bg-card/60 w-full">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 px-4 py-4">
              <div className="space-y-1">
                <p className="text-xs uppercase text-muted-foreground">Next up</p>
                <p className="text-base font-semibold text-foreground">Theory of Change</p>
              </div>
              <Button asChild size="sm" className="gap-2">
                <Link href="/class/strategic-foundations">
                  Resume accelerator <ArrowUpRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

      </section>

      <section id="curriculum-call" className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Book a meeting</p>
          <span className="text-xs text-muted-foreground">Coaching + guidance</span>
        </div>
        <AcceleratorScheduleCard />
      </section>

      <section id="progress" className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Start building</p>
          <span className="text-xs text-muted-foreground">Plan → Publish → Prove</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {START_BUILDING.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/60 px-4 py-3"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section id="roadmap" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Program builder</p>
            <span className="text-xs text-muted-foreground">Templates stay private until published.</span>
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
          <div className="snap-start shrink-0 w-[260px] sm:w-[300px] lg:w-[340px] h-[420px] sm:h-[480px]">
            <Empty
              className="h-full rounded-3xl border-dashed border-border/50 bg-card/40"
              title="Create your first program"
              description="Start from scratch or customize a template to reflect real staffing, outcomes, and funding needs."
              actions={<ProgramWizardLazy triggerLabel="Create program" />}
              size="sm"
              variant="subtle"
            />
          </div>
          {PROGRAM_TEMPLATES.map((template) => (
            <div
              key={template.title}
              className="snap-start shrink-0 w-[260px] sm:w-[300px] lg:w-[340px] h-[420px] sm:h-[480px]"
            >
              <ProgramCard
                title={template.title}
                location={template.location}
                statusLabel="Template"
                chips={template.chips}
                ctaLabel="View template"
                ctaHref="/my-organization?tab=programs"
                ctaTarget="_self"
                patternId={template.patternId}
                className="h-full max-w-none"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SUPPORT_LINKS.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.title}
              href={item.href}
              className="group flex h-full items-center gap-3 rounded-xl border border-border/60 bg-card/60 px-4 py-4 transition hover:bg-muted/50"
              target={item.href.startsWith("http") ? "_blank" : undefined}
              rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </Link>
          )
        })}
      </section>
    </div>
  )
}
