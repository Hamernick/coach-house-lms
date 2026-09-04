"use client"

import Link from "next/link"

import { legacyHomeHeadingFont } from "@/components/public/legacy-home-sections/fonts"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function LegacyHomeCtaSection() {
  return (
    <div className="border-border/60 bg-card/70 rounded-[32px] border p-10 text-center">
      <p className="text-muted-foreground text-sm">Ready to begin?</p>
      <h2
        className={cn(
          legacyHomeHeadingFont.className,
          "mt-4 text-3xl font-semibold"
        )}
      >
        Build the first draft of your nonprofit plan.
      </h2>
      <p className="text-muted-foreground mx-auto mt-3 max-w-2xl text-sm">
        Start with the free platform, then upgrade when you want accelerator
        guidance or ongoing coaching.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg" className="rounded-full px-6">
          <Link href="/sign-up">Start free</Link>
        </Button>
        <Button
          asChild
          size="lg"
          variant="outline"
          className="rounded-full px-6"
        >
          <Link href="/pricing">View pricing</Link>
        </Button>
      </div>
    </div>
  )
}
