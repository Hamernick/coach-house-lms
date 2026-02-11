import type { ReactNode } from "react"

import { CaseStudyAutofillFab } from "@/components/dev/case-study-autofill-fab"

type AuthScreenShellProps = {
  children: ReactNode
}

export function AuthScreenShell({ children }: AuthScreenShellProps) {
  return (
    <>
      <div className="flex min-h-screen items-center justify-center px-6 py-16">
        <div className="w-full max-w-md space-y-6">{children}</div>
      </div>
      <CaseStudyAutofillFab allowToken />
    </>
  )
}
