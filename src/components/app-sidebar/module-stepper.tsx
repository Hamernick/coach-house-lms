"use client"

import Link from "next/link"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import { cn } from "@/lib/utils"

export type StepStatus = "not_started" | "in_progress" | "complete"

export type StepItem = {
  id: string
  href: string
  title: string
  status: StepStatus
  active?: boolean
}

export function ModuleStepper({
  steps,
  onHover,
}: {
  steps: StepItem[]
  onHover?: (href: string) => void
}) {
  return (
    <>
      {steps.map((step, idx) => {
        const isFirst = idx === 0
        const isLast = idx === steps.length - 1
        return (
          <li key={step.id} className="flex items-start gap-3">
            <div className="relative w-5 shrink-0 self-stretch">
              {!isFirst ? (
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-0 h-[14px] w-px -translate-x-1/2 bg-border/50"
                />
              ) : null}
              {!isLast ? (
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-[14px] bottom-0 w-px -translate-x-1/2 bg-border/50"
                />
              ) : null}
              <div className="relative z-10 mt-1 flex justify-center">
                <StepBadge status={step.status} label={idx + 1} />
              </div>
            </div>
            <Link
              href={step.href}
              onMouseEnter={() => onHover?.(step.href)}
              className={cn(
                "flex flex-1 items-start gap-2 rounded-md px-2 py-1.5 text-sm leading-snug transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                step.active && "bg-sidebar-accent text-sidebar-accent-foreground",
              )}
            >
              <span className="min-w-0 flex-1 break-words text-pretty">{step.title}</span>
            </Link>
          </li>
        )
      })}
    </>
  )
}

function StepBadge({ status, label }: { status: StepStatus; label: number }) {
  const styles =
    status === "complete"
      ? {
          border: "border-emerald-500",
          text: "text-emerald-500",
          icon: <CheckIcon className="h-3 w-3" />,
          dashed: false,
        }
      : status === "in_progress"
        ? {
            border: "border-amber-500",
            text: "text-amber-500",
            icon: <span className="text-[10px] font-semibold">{label}</span>,
            dashed: true,
          }
        : {
            border: "border-muted-foreground/60",
            text: "text-muted-foreground",
            icon: <span className="text-[10px] font-semibold">{label}</span>,
            dashed: false,
          }

  return (
    <span
      aria-hidden
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 bg-sidebar",
        styles.border,
      )}
      style={{ borderStyle: styles.dashed ? "dashed" : "solid" }}
    >
      <span className={cn("flex h-4 w-4 items-center justify-center rounded-full bg-transparent text-center leading-none", styles.text)}>
        {styles.icon}
      </span>
    </span>
  )
}
