"use client"

import Link from "next/link"

import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right"
import BookOpenCheck from "lucide-react/dist/esm/icons/book-open-check"
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2"
import ClipboardList from "lucide-react/dist/esm/icons/clipboard-list"
import FileText from "lucide-react/dist/esm/icons/file-text"
import Route from "lucide-react/dist/esm/icons/route"
import Sparkles from "lucide-react/dist/esm/icons/sparkles"

import {
  legacyHomeHeadingFont,
  legacyHomeInterFont,
} from "@/components/public/legacy-home-sections/fonts"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const acceleratorOutcomes = [
  "Origin story",
  "Need statement",
  "Who we serve",
  "Mission, vision, values",
]

const acceleratorPath = [
  {
    title: "Short lessons",
    body: "Watch the concept, then move directly into the work.",
    icon: BookOpenCheck,
  },
  {
    title: "Guided prompts",
    body: "Answer one focused question at a time so your thinking stays usable.",
    icon: ClipboardList,
  },
  {
    title: "Roadmap outputs",
    body: "Turn the answers into funder-ready narrative, strategy, and planning documents.",
    icon: FileText,
  },
]

export function LegacyHomeAcceleratorSection() {
  return (
    <section
      className={cn(legacyHomeInterFont.className, "w-full max-w-[980px]")}
    >
      <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr] lg:items-stretch">
        <div className="border-border/70 bg-card/72 flex min-w-0 flex-col justify-between rounded-[26px] border p-5 shadow-sm backdrop-blur sm:p-7">
          <div className="space-y-5">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Accelerator
            </div>

            <div className="space-y-3">
              <h2
                className={cn(
                  legacyHomeHeadingFont.className,
                  "text-foreground text-3xl leading-tight font-semibold tracking-normal text-balance sm:text-4xl"
                )}
              >
                Build the strategy before you chase the funding.
              </h2>
              <p className="text-muted-foreground max-w-xl text-sm leading-6 sm:text-base sm:leading-7">
                The Coach House accelerator gives founders a structured path
                through formation, positioning, program design, and funding
                readiness. Every lesson ends with a concrete answer your team
                can use in the strategic roadmap.
              </p>
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="h-11 rounded-full px-5">
              <Link href="/sign-up">
                Start free <ArrowUpRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-11 rounded-full px-5"
            >
              <Link href="/pricing">View pricing</Link>
            </Button>
          </div>
        </div>

        <div className="border-border/70 bg-background/82 min-w-0 rounded-[26px] border p-3 shadow-sm backdrop-blur">
          <div className="border-border/65 bg-card/78 overflow-hidden rounded-[20px] border">
            <div className="border-border/70 flex items-center justify-between gap-3 border-b px-4 py-3">
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs font-medium tracking-[0.16em] uppercase">
                  Inside the accelerator
                </p>
                <h3 className="text-foreground mt-1 truncate text-base font-semibold">
                  Idea to Impact Path
                </h3>
              </div>
              <div className="rounded-full border border-sky-500/25 bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-700 dark:text-sky-300">
                9 lessons
              </div>
            </div>

            <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="border-border/70 border-b p-4 lg:border-r lg:border-b-0">
                <div className="space-y-3">
                  {acceleratorPath.map((item, index) => {
                    const Icon = item.icon

                    return (
                      <div
                        key={item.title}
                        className="grid grid-cols-[2rem_1fr] gap-3"
                      >
                        <div className="flex flex-col items-center">
                          <span className="border-border/70 bg-background text-foreground flex h-8 w-8 items-center justify-center rounded-full border shadow-xs">
                            <Icon className="h-4 w-4" aria-hidden />
                          </span>
                          {index < acceleratorPath.length - 1 ? (
                            <span
                              className="bg-border mt-2 h-8 w-px"
                              aria-hidden
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0 pb-3">
                          <p className="text-foreground text-sm font-semibold">
                            {item.title}
                          </p>
                          <p className="text-muted-foreground mt-1 text-xs leading-5">
                            {item.body}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="p-4">
                <div className="border-border/70 bg-background/80 rounded-2xl border p-4">
                  <div className="text-foreground flex items-center gap-2 text-sm font-semibold">
                    <Route
                      className="h-4 w-4 text-emerald-600 dark:text-emerald-300"
                      aria-hidden
                    />
                    Strategic roadmap drafts
                  </div>
                  <div className="mt-4 grid gap-2">
                    {acceleratorOutcomes.map((outcome) => (
                      <div
                        key={outcome}
                        className="border-border/60 bg-card/68 flex min-w-0 items-center gap-2 rounded-xl border px-3 py-2"
                      >
                        <CheckCircle2
                          className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300"
                          aria-hidden
                        />
                        <span className="text-foreground min-w-0 truncate text-sm">
                          {outcome}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {["Formation", "Programs", "Funding"].map((label) => (
                    <div
                      key={label}
                      className="border-border/60 bg-muted/40 rounded-2xl border px-3 py-3 text-center"
                    >
                      <p className="text-muted-foreground text-xs font-medium">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
