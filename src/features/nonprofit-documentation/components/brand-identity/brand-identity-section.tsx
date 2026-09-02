import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export function BrandIdentitySection({
  id,
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  id: string
  eyebrow?: string
  title: string
  description?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      id={id}
      className={cn("scroll-mt-24 border-b py-14 sm:py-20", className)}
      aria-labelledby={`${id}-title`}
    >
      {eyebrow ? (
        <p className="text-muted-foreground text-[0.68rem] font-semibold tracking-[0.15em] uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h2
        id={`${id}-title`}
        className="mt-2 text-xl font-semibold tracking-[-0.025em] sm:text-2xl"
      >
        {title}
      </h2>
      {description ? (
        <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-6">
          {description}
        </p>
      ) : null}
      <div className="mt-8">{children}</div>
    </section>
  )
}

export function BrandIdentitySubsection({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn("mt-14 first:mt-0", className)}>
      <h3 className="text-base font-semibold tracking-[-0.015em]">{title}</h3>
      {description ? (
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
          {description}
        </p>
      ) : null}
      <div className="mt-5">{children}</div>
    </section>
  )
}
