import type { ReactNode } from "react"

import { Dialog, DialogContent } from "@/components/ui/dialog"

type OnboardingDialogShellProps = {
  open: boolean
  presentation: "dialog" | "inline"
  children: ReactNode
}

export function OnboardingDialogShell({
  open,
  presentation,
  children,
}: OnboardingDialogShellProps) {
  if (presentation === "inline") {
    return (
      <div className="relative flex h-full w-full items-stretch overflow-hidden md:items-center md:justify-center">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
        >
          <div
            className="absolute inset-0 opacity-70"
            style={{
              backgroundImage:
                "radial-gradient(circle at 18% 22%, rgba(14, 165, 233, 0.14), transparent 42%), radial-gradient(circle at 82% 14%, rgba(34, 197, 94, 0.12), transparent 38%), radial-gradient(circle at 50% 92%, rgba(99, 102, 241, 0.09), transparent 46%)",
            }}
          />
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage: "radial-gradient(rgba(100,116,139,0.28) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
              backgroundPosition: "-11px -11px",
            }}
          />
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 1000 600"
            fill="none"
          >
            <path
              d="M170 330 C 340 240, 620 240, 830 300"
              stroke="rgba(148, 163, 184, 0.22)"
              strokeWidth="1.5"
              strokeDasharray="6 8"
            />
            <circle cx="170" cy="330" r="12" fill="rgba(59, 130, 246, 0.14)" />
            <circle cx="500" cy="250" r="12" fill="rgba(34, 197, 94, 0.16)" />
            <circle cx="830" cy="300" r="12" fill="rgba(236, 72, 153, 0.12)" />
          </svg>
        </div>

        <section className="relative z-10 bg-card flex h-full max-h-full w-full flex-col overflow-hidden border-0 p-0 shadow-none md:mx-auto md:h-auto md:w-[min(860px,100%)] md:max-h-[min(82vh,920px)] md:rounded-3xl md:border md:border-border/70 md:bg-card/88 md:shadow-[0_26px_72px_-44px_rgba(15,23,42,0.35)] md:backdrop-blur">
          {children}
        </section>
      </div>
    )
  }

  return (
    <Dialog open={open}>
      <DialogContent className="border-border bg-card/80 flex max-h-[92vh] w-[min(720px,92%)] flex-col overflow-hidden rounded-3xl border p-0 shadow-2xl backdrop-blur">
        {children}
      </DialogContent>
    </Dialog>
  )
}
