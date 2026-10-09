import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"

type AuthScreenShellProps = {
  children: ReactNode
  showBrand?: boolean
}

export function AuthScreenShell({ children, showBrand = false }: AuthScreenShellProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-16">
      {showBrand ? (
        <header className="absolute inset-x-0 top-0 flex h-16 items-center px-4 sm:px-6">
          <Link
            href="/"
            aria-label="Coach House home"
            className="focus-visible:ring-ring flex min-h-11 items-center gap-2 rounded-md px-2 focus-visible:outline-none focus-visible:ring-2"
          >
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
            <span className="text-base font-semibold tracking-tight">Coach House</span>
          </Link>
        </header>
      ) : null}
      <div className="w-full max-w-md space-y-6">{children}</div>
    </div>
  )
}
