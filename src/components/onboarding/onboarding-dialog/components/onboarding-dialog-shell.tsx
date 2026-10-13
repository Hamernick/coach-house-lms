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
      <div className="flex h-full w-full items-stretch md:mx-auto md:max-w-[680px] md:items-center">
        <section className="bg-card flex h-full max-h-full w-full flex-col overflow-hidden border-0 p-0 shadow-none md:mx-auto md:h-auto md:max-h-[min(78vh,820px)] md:rounded-3xl md:border md:border-border md:bg-card/80 md:shadow-none md:backdrop-blur">
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
