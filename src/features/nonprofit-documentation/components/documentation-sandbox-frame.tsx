import type { ReactNode } from "react"
import density from "./documentation-density.module.css"

export function DocumentationSandboxFrame({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section
      id="sandbox"
      className="scroll-mt-24 pt-2 pb-4"
      aria-labelledby="sandbox-title"
    >
      <div data-tool-intro className={density.heading}>
        <p className="text-muted-foreground text-xs font-semibold tracking-normal">
          {eyebrow}
        </p>
        <h2
          id="sandbox-title"
          className="text-lg font-semibold tracking-[-0.025em]"
        >
          {title}
        </h2>
        <p className="text-muted-foreground max-w-2xl text-sm">{description}</p>
      </div>
      <div className="bg-card mt-2 overflow-hidden rounded-2xl border">
        {children}
      </div>
    </section>
  )
}
