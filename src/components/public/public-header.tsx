import Image from "next/image"
import Link from "next/link"
import { PublicThemeToggle } from "@/components/organization/public-theme-toggle"

export function PublicHeader() {
  return (
    <header className="border-border/70 bg-background/50 supports-[backdrop-filter]:bg-background/40 sticky top-4 z-50 mx-auto mt-4 w-[min(1100px,92%)] rounded-2xl border px-4 py-3 shadow-md backdrop-blur">
      <nav
        className="flex items-center justify-between gap-4"
        aria-label="Primary"
      >
        <Link
          href="/"
          className="flex items-center gap-2"
          aria-label="Coach House home"
        >
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
          <span className="flex h-8 items-center font-[Inter] text-base leading-none font-semibold tracking-tight sm:text-lg">
            Coach House
          </span>
        </Link>
        <div className="text-muted-foreground flex items-center gap-3 text-sm">
          <Link
            href="/pricing"
            className="hover:text-foreground hidden sm:inline"
          >
            Pricing
          </Link>
          <Link href="/news" className="hover:text-foreground hidden sm:inline">
            News
          </Link>
          <Link
            href="/login"
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-4 py-2 font-medium shadow-sm transition"
          >
            Sign in
          </Link>
          <PublicThemeToggle />
        </div>
      </nav>
    </header>
  )
}
