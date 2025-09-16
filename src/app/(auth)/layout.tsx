import type { ReactNode } from "react"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-secondary/40 px-6 py-16">
      <div className="w-full max-w-md space-y-6">
        {children}
      </div>
    </div>
  )
}
