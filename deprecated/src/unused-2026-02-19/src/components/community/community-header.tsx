import Link from "next/link"
import Image from "next/image"

export function CommunityHeader() {
  return (
    <header className="sticky top-0 z-20 mx-auto mb-8 w-full max-w-4xl border-b border-border/60 bg-background/85 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-6">
      <nav className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
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
          </Link>
        </div>
        <div className="hidden items-center gap-3 text-sm text-muted-foreground sm:flex">
          <Link href="/pricing" className="transition hover:text-foreground">
            Pricing
          </Link>
          <Link href="/login" className="rounded-full border border-border px-4 py-1.5 text-sm font-medium text-foreground transition hover:bg-secondary">
            Sign in
          </Link>
        </div>
      </nav>
    </header>
  )
}
