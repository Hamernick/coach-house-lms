"use client"

import Link from "next/link"

import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right"

import { legacyHomeInterFont } from "@/components/public/legacy-home-sections/fonts"
import { HERO_FLIP_WORDS } from "@/components/public/legacy-home-sections-data"
import { Button } from "@/components/ui/button"
import { FlipWords } from "@/components/ui/flip-words"
import { cn } from "@/lib/utils"

export function LegacyHomeHeroSection() {
  return (
    <div className={cn(legacyHomeInterFont.className, "mx-auto w-full max-w-3xl space-y-6 text-left lg:max-w-4xl")}>
      <div className="inline-flex items-center justify-start gap-2 rounded-full border border-border/60 bg-card/70 px-4 py-2 text-xs text-muted-foreground shadow-sm animate-fade-in">
        <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
        The Coach House Platform
      </div>
      <h1 className="text-balance text-3xl font-normal leading-tight tracking-tight text-[#525252] sm:text-4xl lg:text-5xl animate-soft-pop dark:text-[#A1A1A1]">
        Find, Build, & Fund{" "}
        <FlipWords
          words={HERO_FLIP_WORDS}
          className="min-w-[12ch] font-normal tracking-tight text-black dark:text-white"
        />{" "}
        nonprofits{" "}
        <span className="whitespace-nowrap">
          with <span className="font-semibold">Coach House.</span>
        </span>
      </h1>
      <p className="max-w-xl text-base text-muted-foreground animate-fade-up">
        The platform built for NFP founders, operators, & grassroots organizations — from formation to funding.
      </p>
      <div className="flex flex-wrap items-center justify-start gap-3 pt-2">
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
  )
}
