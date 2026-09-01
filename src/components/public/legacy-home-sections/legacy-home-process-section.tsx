"use client"

import Link from "next/link"

import { legacyHomeHeadingFont } from "@/components/public/legacy-home-sections/fonts"
import { PROCESS_STEPS } from "@/components/public/legacy-home-sections-data"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function LegacyHomeProcessSection() {
  return (
    <>
      <div className="border-border/60 bg-card/70 rounded-[32px] border p-6">
        <div className="text-muted-foreground flex items-center justify-between text-xs uppercase">
          Process
        </div>
        <div className="mt-5 space-y-5">
          {PROCESS_STEPS.map((step) => (
            <div key={step.step} className="flex gap-4">
              <div className="border-border/60 bg-muted text-muted-foreground flex h-10 w-10 items-center justify-center rounded-xl border text-xs font-semibold shadow-sm">
                {step.step}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold">{step.title}</p>
                <p className="text-muted-foreground text-sm">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-border/60 bg-foreground text-background flex flex-col rounded-[32px] border p-6 shadow-xl">
        <p className="text-background/70 text-xs uppercase">Platform note</p>
        <h2
          className={cn(
            legacyHomeHeadingFont.className,
            "mt-4 text-3xl font-semibold"
          )}
        >
          Make it easy for funders to say yes.
        </h2>
        <p className="text-background/80 mt-4 text-sm">
          The platform keeps your mission, plan, and proof in sync. That means
          fewer follow-up emails and a clearer narrative when it matters most.
        </p>
        <Button
          asChild
          size="sm"
          variant="secondary"
          className="mt-auto self-start rounded-full px-4"
        >
          <Link href="/pricing">View pricing</Link>
        </Button>
      </div>
    </>
  )
}
