import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const emptyCardVariants = cva(
  "flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-muted-foreground/40 bg-muted/20 px-6 py-10 text-center shadow-sm",
  {
    variants: {
      variant: {
        default: "",
        subtle: "bg-transparent border-muted-foreground/20",
      },
      size: {
        default: "gap-4",
        sm: "gap-3 py-8",
        lg: "gap-6 py-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface EmptyProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof emptyCardVariants> {
  icon?: React.ReactNode
  title?: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
}

function Empty({
  icon,
  title,
  description,
  actions,
  className,
  variant,
  size,
  ...props
}: EmptyProps) {
  return (
    <div className={cn(emptyCardVariants({ variant, size }), className)} {...props}>
      {icon ? <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">{icon}</div> : null}
      {title ? <h3 className="text-base font-semibold text-foreground">{title}</h3> : null}
      {description ? <p className="text-sm text-muted-foreground max-w-[32ch]">{description}</p> : null}
      {actions ? <div className="mt-2 flex flex-wrap items-center justify-center gap-2">{actions}</div> : null}
    </div>
  )
}

export { Empty }
