"use client"

import Check from "lucide-react/dist/esm/icons/check"

export function Stepper({ step, totalSteps, className }: { step: number; totalSteps: number; className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-1.5 ${className ?? ""}`}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div key={index} className="flex items-center">
          <div
            className={
              `flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors ` +
              (index + 1 < step
                ? "bg-accent text-accent-foreground"
                : index + 1 === step
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground")
            }
          >
            {index + 1 < step ? <Check className="h-3 w-3" /> : index + 1}
          </div>
          {index < totalSteps - 1 ? (
            <div className={`h-0.5 w-6 ${index + 1 < step ? "bg-accent" : "bg-muted"}`} />
          ) : null}
        </div>
      ))}
    </div>
  )
}
