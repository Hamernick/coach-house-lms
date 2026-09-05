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
      className="scroll-mt-8 border-b py-10"
      aria-labelledby="sandbox-title"
    >
      <p className="text-muted-foreground text-xs font-semibold tracking-[0.15em] uppercase">
        {eyebrow}
      </p>
      <h2
        id="sandbox-title"
        className="mt-2 text-2xl font-semibold tracking-[-0.025em]"
      >
        {title}
      </h2>
      <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-6">
        {description}
      </p>
      <div className="bg-card mt-6 overflow-hidden rounded-xl border shadow-xs">
        {children}
      </div>
    </section>
  )
}
