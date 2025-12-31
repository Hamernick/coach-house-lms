"use client"

import Image from "next/image"
import Link from "next/link"

import { PublicThemeToggle } from "@/components/organization/public-theme-toggle"

export function PublicHeader() {
  return (
    <header className="sticky top-4 z-50 mx-auto w-[min(1100px,92%)] rounded-2xl border border-border/70 bg-background/50 px-4 py-3 shadow-md backdrop-blur supports-[backdrop-filter]:bg-background/40">
      <nav className="flex items-center justify-between gap-4" aria-label="Primary">
        <div className="flex items-center gap-2">
          <span className="relative flex h-8 w-8 items-center justify-center">
            <Image
              src="/coach-house-logo-light.png"
              alt="Coach House logo"
              width={32}
              height={32}
              className="block dark:hidden"
              priority
            />
            <Image
              src="/coach-house-logo-dark.png"
              alt="Coach House logo"
              width={32}
              height={32}
              className="hidden dark:block"
              priority
            />
          </span>
          <span className="text-sm font-semibold tracking-tight">Coach House</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Link href="/pricing" className="hidden sm:inline hover:text-foreground">
            Pricing
          </Link>
          <Link href="/news" className="hidden sm:inline hover:text-foreground">
            News
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-primary px-4 py-2 font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            Sign in
          </Link>
          <PublicThemeToggle />
        </div>
      </nav>
    </header>
  )
}
