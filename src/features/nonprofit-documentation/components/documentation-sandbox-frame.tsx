import type { ReactNode } from "react"

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
      className="scroll-mt-24 pt-3 pb-5"
      aria-labelledby="sandbox-title"
    >
      <div data-tool-intro>
        <p className="text-muted-foreground text-xs font-semibold tracking-normal">
          {eyebrow}
        </p>
        <h2
          id="sandbox-title"
          className="mt-2 text-lg font-semibold tracking-[-0.025em]"
        >
          {title}
        </h2>
        <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-5">
          {description}
        </p>
      </div>
      <div className="bg-card mt-3 overflow-hidden rounded-2xl border">
        {children}
      </div>
    </section>
  )
}
