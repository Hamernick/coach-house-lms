"use client"

interface ModuleHeaderProps {
  title: string
  subtitle?: string
  titlePlacement?: "header" | "body"
  showMobileBody?: boolean
}

export function ModuleHeader({
  title,
  subtitle,
  titlePlacement = "body",
  showMobileBody = false,
}: ModuleHeaderProps) {
  return (
    <div className="w-full">
      {titlePlacement === "header" && showMobileBody ? (
        <div className="mx-auto w-full max-w-3xl min-w-0 space-y-1 text-left md:hidden">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {subtitle ? <p className="max-w-2xl text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
      ) : null}
      {titlePlacement === "body" ? (
        <div className="mx-auto w-full max-w-3xl min-w-0 space-y-1 text-left">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {subtitle ? <p className="max-w-2xl text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
      ) : null}
    </div>
  )
}
