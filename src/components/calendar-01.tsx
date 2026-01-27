import * as React from "react"

import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

type Calendar01Props = React.ComponentProps<typeof Calendar>

export default function Calendar01({ className, ...props }: Calendar01Props) {
  return (
    <Calendar
      className={cn("rounded-lg border shadow-sm", className)}
      {...props}
    />
  )
}
