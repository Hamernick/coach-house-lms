import Image from "next/image"
import Link from "next/link"

import { LoginForm } from "@/components/auth/login-form"

type SearchParams = Record<string, string | string[] | undefined>

type LoginPageProps = {
  searchParams?: Promise<SearchParams>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolved = searchParams ? await searchParams : {}

  const redirect = typeof resolved.redirect === "string" ? resolved.redirect : undefined
  const error = typeof resolved.error === "string" ? resolved.error : null

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <span className="relative flex size-9 items-center justify-center">
              <Image
                src="/coach-house-logo-light.png"
                alt="Coach House logo"
                width={36}
                height={36}
                className="block dark:hidden"
                priority
              />
              <Image
                src="/coach-house-logo-dark.png"
                alt="Coach House logo"
                width={36}
                height={36}
                className="hidden dark:block"
                priority
              />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-base font-extrabold tracking-tight">Coach</span>
              <span className="-mt-2 text-base font-extrabold tracking-tight">House</span>
            </span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm space-y-6">
            <div className="space-y-2 text-center md:text-left">
              <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
              <p className="text-sm text-muted-foreground">
                Access your courses and continue where you left off.
              </p>
            </div>
            <LoginForm redirectTo={redirect} initialError={error} />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <Image
          src="https://images.unsplash.com/photo-1602146057681-08560aee8cde"
          alt="Students collaborating during a workshop"
          fill
          priority
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.75] dark:grayscale"
          sizes="(max-width: 1024px) 0px, 50vw"
        />
      </div>
    </div>
  )
}
