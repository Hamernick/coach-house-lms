import Image from "next/image"
import Link from "next/link"

import { PublicThemeToggle } from "@/components/organization/public-theme-toggle"
import { Button } from "@/components/ui/button"

function HomeMarketplaceBrand() {
  return (
    <Link
      href="/"
      className="focus-visible:ring-ring flex min-w-0 items-center gap-2 rounded-lg px-1 py-1 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      aria-label="Coach House home"
    >
      <span className="relative flex size-8 shrink-0 items-center justify-center">
        <Image
          src="/coach-house-logo-light.png"
          alt=""
          width={32}
          height={32}
          className="block dark:hidden"
          priority
        />
        <Image
          src="/coach-house-logo-dark.png"
          alt=""
          width={32}
          height={32}
          className="hidden dark:block"
          priority
        />
      </span>
      <span className="min-w-0 leading-none">
        <span className="block truncate text-base font-semibold tracking-tight">
          Coach House
        </span>
        <span className="text-muted-foreground mt-1 block text-[10px] font-semibold tracking-[0.18em]">
          ALPHA
        </span>
      </span>
    </Link>
  )
}

export function HomeMarketplaceHeader() {
  return (
    <header className="bg-background text-foreground flex min-h-16 shrink-0 items-center justify-between gap-3 px-4 py-2 sm:px-5">
      <HomeMarketplaceBrand />
      <nav aria-label="Primary" className="flex items-center gap-1 sm:gap-2">
        <Button asChild variant="ghost" size="sm" className="hidden sm:flex">
          <Link href="/find">Collect</Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href="/?section=login">Sign in</Link>
        </Button>
        <Button asChild size="sm" className="rounded-full px-4">
          <Link href="/?section=signup">Join</Link>
        </Button>
        <PublicThemeToggle className="size-10" />
      </nav>
    </header>
  )
}
