"use client"

import Link from "next/link"

import { legacyHomeHeadingFont } from "@/components/public/legacy-home-sections/fonts"
import { PROCESS_STEPS } from "@/components/public/legacy-home-sections-data"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function LegacyHomeProcessSection() {
  return (
    <>
      <div className="rounded-[32px] border border-border/60 bg-card/70 p-6">
        <div className="flex items-center justify-between text-xs uppercase text-muted-foreground">Process</div>
        <div className="mt-5 space-y-5">
          {PROCESS_STEPS.map((step) => (
            <div key={step.step} className="flex gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-muted text-xs font-semibold text-muted-foreground shadow-sm">
                {step.step}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold">{step.title}</p>
                <p className="text-sm text-muted-foreground">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col rounded-[32px] border border-border/60 bg-foreground p-6 text-background shadow-xl">
        <p className="text-xs uppercase text-background/70">Platform note</p>
        <h2 className={cn(legacyHomeHeadingFont.className, "mt-4 text-3xl font-semibold")}>
          Make it easy for funders to say yes.
        </h2>
        <p className="mt-4 text-sm text-background/80">
          The platform keeps your mission, plan, and proof in sync. That means fewer follow-up emails and a clearer
          narrative when it matters most.
        </p>
        <Button asChild size="sm" variant="secondary" className="mt-auto self-start rounded-full px-4">
          <Link href="/pricing">View pricing</Link>
        </Button>
      </div>
    </>
  )
}
